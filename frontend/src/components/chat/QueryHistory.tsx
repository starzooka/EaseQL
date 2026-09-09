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

  return (
    <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70 shadow-lg">
      <div className="border-b border-slate-800/80 p-4 sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-blue-500 uppercase">04 / Query history</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-white">Saved results</h2>
          </div>
          <span className="text-xs text-slate-500">{queries.length} saved</span>
        </div>
      </div>

      <div className="p-4 sm:p-6">
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
                onOpen={setSelectedQueryId}
              />
            ))}
          </ul>
        )}
      </div>

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
