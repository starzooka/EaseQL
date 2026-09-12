"use client";

import { useState } from "react";

import type { SavedQueryResult } from "@/lib/api/savedQueryResults";
import SavedQueryCard from "./SavedQueryCard";
import SavedResultViewer from "./SavedResultViewer";

interface QueryHistoryProps {
  queries: SavedQueryResult[];
  loading: boolean;
}

export default function QueryHistory({
  queries,
  loading,
}: QueryHistoryProps) {
  const [selectedQueryId, setSelectedQueryId] =
    useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const openQuery = (queryId: number) => {
    setSelectedQueryId(queryId);
    setExpanded(true);
  };

  return (
    <section className="overflow-hidden border border-[var(--line)] bg-[var(--ink)]">
      <button
        type="button"
        onClick={() =>
          setExpanded((current) => !current)
        }
        aria-expanded={expanded}
        className="flex min-h-[46px] w-full items-center justify-between gap-4 border-b border-[var(--line)] px-4 py-3 text-left transition-colors hover:bg-[rgba(237,234,226,0.03)] sm:px-5"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--muted)]">
              04 / Query history
            </p>

            <h2 className="mt-1 text-base font-semibold tracking-tight text-[var(--paper)]">
              Saved results
            </h2>
          </div>

          <span className="border border-[var(--line)] px-2.5 py-1 text-[10px] font-semibold text-[var(--muted)]">
            {queries.length} saved
          </span>
        </div>

        <span className="flex shrink-0 items-center gap-2 text-xs text-[var(--muted)]">
          {expanded ? "Hide" : "Browse"}

          <span
            aria-hidden="true"
            className={`text-base transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          >
            ⌄
          </span>
        </span>
      </button>

      {expanded ? (
        <div className="p-4 sm:p-5">
          {loading ? (
            <div
              className="grid gap-3 lg:grid-cols-2"
              aria-label="Loading saved queries"
            >
              <div className="h-28 animate-pulse bg-[var(--line)]" />
              <div className="h-28 animate-pulse bg-[var(--line)]" />
            </div>
          ) : queries.length === 0 ? (
            <div className="flex min-h-24 items-center justify-center border border-dashed border-[var(--line)] px-4 text-center">
              <p className="text-xs leading-5 text-[var(--muted)]">
                Saved query results for this chat will appear here.
              </p>
            </div>
          ) : (
            <ul
              className="grid gap-3 lg:grid-cols-2"
              aria-label="Saved query results"
            >
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
      ) : null}

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
