"use client";

import type { SavedQueryResult } from "@/lib/api/savedQueryResults";

interface SavedQueryCardProps {
  query: SavedQueryResult;
  selected: boolean;
  onOpen: (queryId: number) => void;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function SavedQueryCard({ query, selected, onOpen }: SavedQueryCardProps) {
  const status = query.execution_status ?? "unknown";
  const statusColor = status === "success" ? "text-emerald-300" : "text-amber-300";

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(query.id)}
        aria-pressed={selected}
        className={`w-full rounded-lg border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 ${
          selected
            ? "border-blue-500/50 bg-blue-500/10"
            : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <p className="line-clamp-2 min-w-0 flex-1 text-sm font-medium leading-5 text-slate-200">
            {query.natural_language_query}
          </p>
          <span className={`shrink-0 text-[10px] font-semibold tracking-wider uppercase ${statusColor}`}>
            {status}
          </span>
        </div>
        <p className="mt-2 truncate font-mono text-[11px] text-slate-500">{query.generated_sql}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
          <span>{query.row_count ?? 0} rows</span>
          <span>{query.execution_time_ms ?? 0} ms</span>
          <time dateTime={query.created_at}>{formatDate(query.created_at)}</time>
        </div>
      </button>
    </li>
  );
}
