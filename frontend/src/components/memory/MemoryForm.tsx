"use client";

import { useState, type FormEvent } from "react";

import type { CreateMemoryInput, UserMemory } from "@/lib/api/memories";

export type MemoryFormValues = CreateMemoryInput;

interface MemoryFormProps {
  memory: UserMemory | null;
  submitting: boolean;
  error: string;
  onSubmit: (values: MemoryFormValues) => Promise<boolean>;
  onCancel: () => void;
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function containsSensitiveSecret(values: Record<string, string | null>) {
  return /password|passcode|token|secret|credential|api[\s_-]*key|access[\s_-]*key|private[\s_-]*key|client[\s_-]*secret|bearer/i.test(
    Object.values(values).join(" "),
  );
}

function getInitialValues(memory: UserMemory | null): MemoryFormValues {
  return {
    memory_type: memory?.memory_type ?? "preference",
    key: memory?.key ?? "user_preference",
    value: memory?.value ?? "",
    source: memory?.source ?? "user",
    expires_at: toDateTimeLocal(memory?.expires_at ?? null),
  };
}

export default function MemoryForm({ memory, submitting, error, onSubmit, onCancel }: MemoryFormProps) {
  const [values, setValues] = useState<MemoryFormValues>(() => getInitialValues(memory));
  const [validationError, setValidationError] = useState("");

  const updateField = (field: keyof MemoryFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setValidationError("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedValues = {
      memory_type: values.memory_type.trim(),
      key: values.key.trim(),
      value: values.value.trim(),
      source: values.source.trim(),
      expires_at: values.expires_at ? new Date(values.expires_at).toISOString() : null,
    };

    if (!normalizedValues.value) {
      setValidationError("Enter a preference or memory to save.");
      return;
    }

    if (containsSensitiveSecret(normalizedValues)) {
      setValidationError("Do not store passwords, tokens, credentials, or other sensitive secrets.");
      return;
    }

    const saved = await onSubmit(normalizedValues);
    if (!saved) return;

    if (!memory) {
      setValues(getInitialValues(null));
    }
  };

  const cancel = () => {
    setValues(getInitialValues(memory));
    setValidationError("");
    onCancel();
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-[var(--line)] bg-[rgba(138,133,120,0.05)] p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--amber)] uppercase">{memory ? "Edit memory" : "New memory"}</p>
          <h3 className="mt-1 text-base font-bold text-[var(--paper)]">{memory ? "Update preference" : "Remember a preference"}</h3>
        </div>
      </div>

      {validationError || error ? (
        <div role="alert" className="mb-4 rounded-lg border border-[rgba(217,107,95,0.35)] bg-[rgba(217,107,95,0.06)] px-3 py-2.5 text-xs leading-5 text-[var(--danger)]">
          {validationError || error}
        </div>
      ) : null}

      <div className="grid gap-3">
        <label className="text-xs text-[var(--muted)]">
          Preference or memory
          <textarea
            value={values.value}
            onChange={(event) => updateField("value", event.target.value)}
            disabled={submitting}
            rows={3}
            className="mt-1.5 w-full resize-y rounded-md border border-[var(--line-strong)] bg-[var(--ink)] px-3 py-2.5 text-sm leading-6 text-[var(--paper)] outline-none transition focus:border-[var(--amber)] disabled:opacity-60"
            placeholder="Bar charts work best for monthly comparisons."
          />
        </label>
        <label className="text-xs text-[var(--muted)]">
          Expiration (optional)
          <input
            type="datetime-local"
            value={values.expires_at ?? ""}
            onChange={(event) => updateField("expires_at", event.target.value)}
            disabled={submitting}
            className="mt-1.5 w-full rounded-md border border-[var(--line-strong)] bg-[var(--ink)] px-3 py-2.5 text-sm text-[var(--paper)] outline-none transition focus:border-[var(--amber)] disabled:opacity-60"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-[var(--amber)] px-4 py-2.5 text-xs font-semibold text-[var(--paper)] transition hover:bg-[var(--amber)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--amber)] disabled:cursor-not-allowed disabled:bg-[var(--line)] disabled:text-[var(--muted)]"
        >
          {submitting ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={submitting}
          className="rounded-md border border-[var(--line-strong)] px-4 py-2.5 text-xs font-semibold text-[var(--paper)] transition hover:border-[var(--line-strong)] hover:text-[var(--paper)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--amber)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}