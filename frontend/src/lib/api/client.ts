const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ErrorPayload = {
  detail?: string | { msg?: string }[];
  message?: string;
};

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;

  const error = payload as ErrorPayload;
  if (typeof error.detail === "string") return error.detail;
  if (Array.isArray(error.detail)) {
    const messages = error.detail.map((item) => item.msg).filter(Boolean);
    if (messages.length > 0) return messages.join("; ");
  }
  if (typeof error.message === "string") return error.message;
  return fallback;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const hasBody = init.body !== undefined;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(payload, `Request failed with status ${response.status}.`),
      response.status,
    );
  }

  return payload as T;
}
