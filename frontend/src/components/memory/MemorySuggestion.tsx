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
    <section className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 shadow-sm sm:p-5" aria-label="Memory suggestion">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-blue-400 uppercase">Suggested memory</p>
          <p className="mt-1.5 text-sm leading-6 text-slate-200">{suggestion.value}</p>
          {error ? <p role="alert" className="mt-2 text-xs text-red-300">{error}</p> : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onRemember}
            disabled={saving}
            className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Remember"}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            disabled={saving}
            className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Not now
          </button>
        </div>
      </div>
    </section>
  );
}
