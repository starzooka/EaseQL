"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AuthResponse = {
  access_token?: string;
  token_type?: string;
  message?: string;
  email?: string;
  authenticated?: boolean;
};

export type AuthContextValue = {
  token: string | null;
  userEmail: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      const response = await fetch(`${API_URL}/api/auth/session`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        setToken(null);
        setUserEmail(null);
        return;
      }

      const data = (await response.json()) as Partial<AuthResponse> & { detail?: string };
      setToken(data.access_token ?? null);
      setUserEmail(data.email ?? userEmail ?? null);
    } catch {
      setToken(null);
      setUserEmail(null);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    const body = new URLSearchParams();
    body.set("username", email.trim().toLowerCase());
    body.set("password", password);

    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = (await response.json()) as Partial<AuthResponse> & { detail?: string };
    if (!response.ok) {
      throw new Error(data.detail ?? "Login failed.");
    }

    setToken(data.access_token ?? null);
    setUserEmail(email.trim().toLowerCase());
    setLoading(false);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });

    const data = (await response.json()) as Partial<AuthResponse> & { detail?: string };
    if (!response.ok) {
      throw new Error(data.detail ?? "Registration failed.");
    }

    setToken(data.access_token ?? null);
    setUserEmail(email.trim().toLowerCase());
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore logout request failures; the browser cookie is still cleared client-side.
    }

    setToken(null);
    setUserEmail(null);
    setLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      userEmail,
      loading,
      isAuthenticated: Boolean(userEmail || token),
      login,
      register,
      logout,
    }),
    [loading, login, logout, register, token, userEmail],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
