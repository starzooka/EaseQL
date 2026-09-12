type QueryResult = Record<string, unknown>;

export interface MemorySuggestion {
  suggested: true;
  memory_type: string;
  key: string;
  value: string;
  expires_at: string | null;
}

export interface QueryResponse {
  sql: string;
  results: QueryResult[];
  memory_suggestion?: MemorySuggestion;
}

export interface ResultsDisplayProps {
  query: QueryResponse | null;
  error: string;
  columns: string[];
  displayValue: (value: unknown) => string;
}

export default function ResultsDisplay({
  query,
  error,
  columns,
  displayValue,
}: ResultsDisplayProps) {
  return (
    <>
      {error ? (
        <div
          role="alert"
          className="border border-[rgba(217,107,95,0.35)] bg-[rgba(217,107,95,0.06)] px-5 py-4 text-xs font-medium text-[var(--danger)] sm:px-6 sm:py-5 sm:text-sm"
        >
          {error}
        </div>
      ) : null}

      <section>
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[var(--muted)] sm:text-xs">
              03 / Results
            </p>

            <h2 className="mt-1 text-xl font-semibold tracking-tight text-[var(--paper)] sm:text-2xl">
              Your answer
            </h2>
          </div>

          {query ? (
            <span className="border border-[rgba(232,163,61,0.35)] bg-[rgba(232,163,61,0.05)] px-3 py-1.5 text-[10px] font-bold text-[var(--amber)] sm:text-xs">
              {query.results.length} rows returned
            </span>
          ) : null}
        </div>

        <div className="grid overflow-hidden border border-[var(--line)] bg-[var(--ink)] shadow-none lg:grid-cols-[0.85fr_1.15fr]">
          {/* Generated SQL */}
          <div className="flex flex-col border-b border-[var(--line)] bg-transparent p-4 sm:p-5 lg:border-b-0 lg:border-r lg:p-6">
            <div className="mb-4 flex items-center justify-between text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--muted)] sm:mb-5 sm:text-xs">
              <span className="text-[var(--amber)]">
                Generated SQL
              </span>

              <span className="text-[var(--muted)]">
                read only
              </span>
            </div>

            <pre className="w-full flex-1 overflow-auto whitespace-pre-wrap border border-[var(--line)] bg-transparent p-4 font-mono text-[13px] leading-relaxed text-[var(--amber)] sm:p-5 sm:text-sm sm:leading-7">
              {query?.sql ??
                "Your generated SQL will appear here."}
            </pre>
          </div>

          {/* Result table */}
          <div className="min-h-48 overflow-auto p-0 sm:min-h-72">
            {query && query.results.length > 0 ? (
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <thead className="sticky top-0 z-10 bg-[var(--ink)]">
                  <tr className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[var(--muted)] sm:text-xs">
                    {columns.map((column) => (
                      <th
                        key={column}
                        className="whitespace-nowrap border-b border-[var(--line)] px-4 py-3 text-left first:pl-5 sm:px-6 sm:py-4 sm:first:pl-7"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--line)]">
                  {query.results.map(
                    (row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="transition-colors hover:bg-[rgba(95,168,143,0.04)]"
                      >
                        {columns.map((column) => (
                          <td
                            key={column}
                            className="whitespace-nowrap px-4 py-3 text-[var(--teal)] first:pl-5 sm:px-6 sm:py-4 sm:first:pl-7"
                          >
                            {displayValue(
                              row[column]
                            )}
                          </td>
                        ))}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            ) : (
              <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 p-5 text-center sm:min-h-72 sm:p-7">
                <span
                  className="flex h-10 w-10 items-center justify-center border border-[var(--line)] bg-transparent text-base text-[var(--muted)]"
                  aria-hidden="true"
                >
                  ▤
                </span>

                <p className="text-xs font-medium text-[var(--paper)] sm:text-sm">
                  Run a question to see the data table.
                </p>

                <p className="max-w-xs text-[11px] leading-5 text-[var(--muted)]">
                  Ask something in the conversation
                  above, or upload a dataset if you
                  haven&apos;t yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
