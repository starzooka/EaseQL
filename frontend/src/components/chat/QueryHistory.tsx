"use client";

import { useState } from "react";

import type { SavedQueryResult } from "@/lib/api/savedQueryResults";
import SavedQueryCard from "./SavedQueryCard";
import SavedResultViewer from "./SavedResultViewer";

interface QueryHistoryProps {
  queries: SavedQueryResult[];
  loading: boolean;
}

export default function QueryHistory({ queries, loading }: QueryHistoryProps) {
  const [selectedQueryId, setSelectedQueryId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const openQuery = (queryId: number) => {
    setSelectedQueryId(queryId);
    setExpanded(true);
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70 shadow-lg">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-4 border-b border-slate-800/80 p-4 text-left transition hover:bg-slate-900/60 sm:p-5"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-blue-500 uppercase">04 / Query history</p>
            <h2 className="mt-1 text-base font-bold tracking-tight text-white">Saved results</h2>
          </div>
          <span className="rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-slate-400">
            {queries.length} saved
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
          {expanded ? "Hide" : "Browse"}
          <span aria-hidden="true" className={`text-base transition-transform ${expanded ? "rotate-180" : ""}`}>⌄</span>
        </span>
      </button>

      {expanded ? <div className="p-4 sm:p-5">
        {loading ? (
          <div className="grid gap-3 lg:grid-cols-2" aria-label="Loading saved queries">
            <div className="h-28 animate-pulse rounded-lg bg-slate-900" />
            <div className="h-28 animate-pulse rounded-lg bg-slate-900" />
          </div>
        ) : queries.length === 0 ? (
          <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-slate-800 px-4 text-center">
            <p className="text-xs leading-5 text-slate-500">Saved query results for this chat will appear here.</p>
          </div>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2" aria-label="Saved query results">
            {queries.map((query) => (
              <SavedQueryCard
                key={query.id}
                query={query}
                selected={selectedQueryId === query.id}
                onOpen={openQuery}
              />
            ))}
          </ul>
        )}
      </div>
      : null}

      {selectedQueryId !== null ? (
        <SavedResultViewer
          key={selectedQueryId}
          queryId={selectedQueryId}
          onClose={() => setSelectedQueryId(null)}
        />
      ) : null}
    </section>
  );
}
