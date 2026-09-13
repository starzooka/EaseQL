"use client";

import type { SavedQueryResult } from "@/lib/api/savedQueryResults";

interface SavedQueryCardProps {
  query: SavedQueryResult;
  selected: boolean;
  onOpen: (queryId: number) => void;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function SavedQueryCard({
  query,
  selected,
  onOpen,
}: SavedQueryCardProps) {
  const status = query.execution_status ?? "unknown";

  const statusColor =
    status === "success"
      ? "text-[var(--teal)]"
      : "text-[var(--amber)]";

  return (
    <li id={`query-history-${query.id}`}>
      <button
        type="button"
        onClick={() => onOpen(query.id)}
        aria-pressed={selected}
        className={`w-full border p-4 text-left transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--amber)] ${
          selected
            ? "border-[var(--amber)] bg-[rgba(232,163,61,0.05)]"
            : "border-[var(--line)] bg-transparent hover:border-[var(--line-strong)] hover:bg-[rgba(237,234,226,0.02)]"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <p className="line-clamp-2 min-w-0 flex-1 text-sm font-medium leading-5 text-[var(--paper)]">
            {query.natural_language_query}
          </p>

          <span
            className={`shrink-0 text-[10px] font-semibold tracking-wider uppercase ${statusColor}`}
          >
            {status}
          </span>
        </div>

        <p className="mt-2 truncate font-mono text-[11px] text-[var(--amber)]">
          {query.generated_sql}
        </p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[var(--muted)]">
          <span>{query.row_count ?? 0} rows</span>
          <span>{query.execution_time_ms ?? 0} ms</span>
          <time dateTime={query.created_at}>
            {formatDate(query.created_at)}
          </time>
        </div>
      </button>
    </li>
  );
}
