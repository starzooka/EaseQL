"use client";

import type { MemorySuggestion } from "@/components/ResultsDisplay";

interface MemorySuggestionProps {
  suggestion: MemorySuggestion;
  saving: boolean;
  error: string;
  onRemember: () => void;
  onDismiss: () => void;
}

export default function MemorySuggestion({ suggestion, saving, error, onRemember, onDismiss }: MemorySuggestionProps) {
  return (
    <section className="rounded-xl border border-[rgba(232,163,61,0.35)] bg-[var(--amber)]/5 p-4 shadow-sm sm:p-5" aria-label="Memory suggestion">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--amber)] uppercase">Suggested memory</p>
          <p className="mt-1.5 text-sm leading-6 text-[var(--paper)]">{suggestion.value}</p>
          {error ? <p role="alert" className="mt-2 text-xs text-[var(--danger)]">{error}</p> : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onRemember}
            disabled={saving}
            className="rounded-md bg-[var(--amber)] px-3 py-2 text-xs font-semibold text-[var(--paper)] transition hover:bg-[var(--amber)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--amber)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Remember"}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            disabled={saving}
            className="rounded-md border border-[var(--line-strong)] px-3 py-2 text-xs font-semibold text-[var(--paper)] transition hover:border-[var(--line-strong)] hover:text-[var(--paper)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--amber)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Not now
          </button>
        </div>
      </div>
    </section>
  );
}