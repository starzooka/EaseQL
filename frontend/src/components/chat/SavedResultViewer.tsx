"use client";

import { useEffect, useState } from "react";

import {
  getSavedQueryResult,
  type SavedQueryResult,
} from "@/lib/api/savedQueryResults";

interface SavedResultViewerProps {
  queryId: number;
  onClose: () => void;
}

function displayValue(value: unknown) {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function SavedResultViewer({
  queryId,
  onClose,
}: SavedResultViewerProps) {
  const [query, setQuery] =
    useState<SavedQueryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void getSavedQueryResult(queryId)
      .then((savedQuery) => {
        if (!cancelled) {
          setQuery(savedQuery);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load this saved result."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
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
  const columns =
    rows.length > 0 ? Object.keys(rows[0]) : [];

  const status = query?.execution_status ?? "unknown";

  const statusColor =
    status === "success"
      ? "text-[var(--teal)]"
      : "text-[var(--amber)]";

  return (
    <div className="border-t border-[var(--line)] bg-[var(--ink)] p-4 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--amber)]">
            Saved historical result
          </p>

          <h3 className="mt-1 text-lg font-semibold tracking-tight text-[var(--paper)]">
            Previous query
          </h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close saved result"
          className="flex h-8 w-8 items-center justify-center border border-[var(--line)] p-0 text-[var(--muted)] transition-colors hover:border-[var(--amber)] hover:text-[var(--amber)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--amber)]"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="h-4 w-4"
          >
            <path
              d="m5 5 10 10M15 5 5 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {loading ? (
        <div
          className="space-y-3"
          aria-label="Loading saved result"
        >
          <div className="h-16 animate-pulse bg-[var(--line)]" />
          <div className="h-28 animate-pulse bg-[var(--line)]" />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="border border-[rgba(217,107,95,0.35)] bg-[rgba(217,107,95,0.06)] p-4 text-xs text-[var(--danger)]"
        >
          <p>{error}</p>

          <button
            type="button"
            onClick={retry}
            className="mt-2 border-b border-[rgba(217,107,95,0.4)] px-0 py-1 text-xs font-semibold text-[var(--danger)] hover:border-[var(--danger)]"
          >
            Try again
          </button>
        </div>
      ) : query ? (
        <>
          <div className="mb-4 border border-[var(--line)] bg-transparent p-4">
            <span className="block text-[10px] font-bold tracking-wider uppercase text-[var(--muted)]">
              Original question
            </span>

            <p className="mt-1.5 text-sm leading-6 text-[var(--paper)]">
              {query.natural_language_query}
            </p>
          </div>

          <div className="mb-4 grid gap-2 text-xs sm:grid-cols-4">
            <div className="border border-[var(--line)] bg-transparent p-3">
              <span className="block text-[10px] tracking-wider uppercase text-[var(--muted)]">
                Status
              </span>

              <span
                className={`mt-1 block font-semibold uppercase ${statusColor}`}
              >
                {status}
              </span>
            </div>

            <div className="border border-[var(--line)] bg-transparent p-3">
              <span className="block text-[10px] tracking-wider uppercase text-[var(--muted)]">
                Rows
              </span>

              <span className="mt-1 block font-semibold text-[var(--teal)]">
                {query.row_count ?? "Not recorded"}
              </span>
            </div>

            <div className="border border-[var(--line)] bg-transparent p-3">
              <span className="block text-[10px] tracking-wider uppercase text-[var(--muted)]">
                Execution
              </span>

              <span className="mt-1 block font-semibold text-[var(--paper)]">
                {query.execution_time_ms === null
                  ? "Not recorded"
                  : `${query.execution_time_ms} ms`}
              </span>
            </div>

            <div className="border border-[var(--line)] bg-transparent p-3">
              <span className="block text-[10px] tracking-wider uppercase text-[var(--muted)]">
                Created
              </span>

              <time
                dateTime={query.created_at}
                className="mt-1 block font-semibold text-[var(--paper)]"
              >
                {formatDate(query.created_at)}
              </time>
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-[10px] font-bold tracking-wider uppercase text-[var(--muted)]">
              <span className="text-[var(--amber)]">
                Generated SQL
              </span>

              <span>read only</span>
            </div>

            <pre className="max-h-48 overflow-auto whitespace-pre-wrap border border-[var(--line)] bg-transparent p-4 font-mono text-xs leading-5 text-[var(--amber)]">
              {query.generated_sql}
            </pre>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-[10px] font-bold tracking-wider uppercase text-[var(--muted)]">
              <span className="text-[var(--teal)]">
                Stored result rows
              </span>

              <span>read only</span>
            </div>

            <div className="max-h-80 overflow-auto border border-[var(--line)] bg-transparent">
              {rows.length > 0 ? (
                <table className="w-full border-collapse text-left text-xs sm:text-sm">
                  <thead className="sticky top-0 z-10 bg-[var(--ink)]">
                    <tr className="text-[10px] font-semibold tracking-wider uppercase text-[var(--muted)]">
                      {columns.map((column) => (
                        <th
                          key={column}
                          className="whitespace-nowrap border-b border-[var(--line)] px-4 py-3 first:pl-5 sm:px-6 sm:py-4 sm:first:pl-7"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[var(--line)]">
                    {rows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="transition-colors hover:bg-[rgba(95,168,143,0.04)]"
                      >
                        {columns.map((column) => (
                          <td
                            key={column}
                            className="whitespace-nowrap px-4 py-3 text-[var(--teal)] first:pl-5 sm:px-6 sm:py-4 sm:first:pl-7"
                          >
                            {displayValue(row[column])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-6 text-center text-xs text-[var(--muted)]">
                  This query did not store any result rows.
                </p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
