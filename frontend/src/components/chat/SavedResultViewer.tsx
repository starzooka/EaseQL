"use client";

import { useEffect, useState } from "react";

import { getSavedQueryResult, type SavedQueryResult } from "@/lib/api/savedQueryResults";

interface SavedResultViewerProps {
  queryId: number;
  onClose: () => void;
}

function displayValue(value: unknown) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function SavedResultViewer({ queryId, onClose }: SavedResultViewerProps) {
  const [query, setQuery] = useState<SavedQueryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void getSavedQueryResult(queryId)
      .then((savedQuery) => {
        if (!cancelled) setQuery(savedQuery);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Could not load this saved result.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [queryId, retryKey]);

  const retry = () => {
    setLoading(true);
    setError("");
    setQuery(null);
    setRetryKey((current) => current + 1);
  };

  const rows = query?.result_data ?? [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const status = query?.execution_status ?? "unknown";
  const statusColor = status === "success" ? "text-emerald-300" : "text-amber-300";

  return (
    <div className="border-t border-slate-800 bg-slate-950 p-4 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-blue-500 uppercase">Saved result</p>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-white">Persisted query</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close saved result"
          className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-900 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3" aria-label="Loading saved result">
          <div className="h-16 animate-pulse rounded-lg bg-slate-900" />
          <div className="h-28 animate-pulse rounded-lg bg-slate-900" />
        </div>
      ) : error ? (
        <div role="alert" className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-200">
          <p>{error}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-2 font-semibold text-red-300 underline decoration-red-400/50 underline-offset-4 hover:text-red-100"
          >
            Try again
          </button>
        </div>
      ) : query ? (
        <>
          <p className="mb-4 text-sm leading-6 text-slate-200">{query.natural_language_query}</p>

          <div className="mb-4 grid gap-2 text-xs sm:grid-cols-4">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <span className="block text-[10px] tracking-wider text-slate-500 uppercase">Status</span>
              <span className={`mt-1 block font-semibold uppercase ${statusColor}`}>{status}</span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <span className="block text-[10px] tracking-wider text-slate-500 uppercase">Rows</span>
              <span className="mt-1 block font-semibold text-slate-200">{query.row_count ?? 0}</span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <span className="block text-[10px] tracking-wider text-slate-500 uppercase">Execution</span>
              <span className="mt-1 block font-semibold text-slate-200">{query.execution_time_ms ?? 0} ms</span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <span className="block text-[10px] tracking-wider text-slate-500 uppercase">Created</span>
              <time dateTime={query.created_at} className="mt-1 block font-semibold text-slate-200">{formatDate(query.created_at)}</time>
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              <span>Generated SQL</span>
              <span className="text-blue-500">read only</span>
            </div>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-900 p-4 font-mono text-xs leading-5 text-blue-300">
              {query.generated_sql}
            </pre>
          </div>

          <div>
            <div className="mb-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Stored result data</div>
            <div className="max-h-80 overflow-auto rounded-lg border border-slate-800 bg-slate-900">
              {rows.length > 0 ? (
                <table className="w-full border-collapse text-left text-xs sm:text-sm">
                  <thead className="sticky top-0 bg-slate-900 shadow-sm">
                    <tr className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                      {columns.map((column) => (
                        <th key={column} className="whitespace-nowrap border-b border-slate-800 px-4 py-3">{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="transition-colors hover:bg-slate-800/50">
                        {columns.map((column) => (
                          <td key={column} className="whitespace-nowrap px-4 py-3 text-slate-300">{displayValue(row[column])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-6 text-center text-xs text-slate-500">This query did not store any result rows.</p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
