type QueryResult = Record<string, unknown>;

export interface QueryResponse {
  sql: string;
  results: QueryResult[];
}

export interface ResultsDisplayProps {
  query: QueryResponse | null;
  error: string;
  columns: string[];
  displayValue: (value: unknown) => string;
}

export default function ResultsDisplay({ query, error, columns, displayValue }: ResultsDisplayProps) {
  return (
    <>
      {error && (
        <div role="alert" className="rounded-xl border border-red-900/50 bg-red-950/50 px-5 py-4 text-xs font-medium text-red-400 shadow-sm sm:px-6 sm:py-5 sm:text-sm">
          {error}
        </div>
      )}

      <section>
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
          <div>
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase sm:text-xs">03 / Results</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-white sm:mt-1.5 sm:text-2xl">Your answer</h2>
          </div>
          {query && <span className="rounded-full border border-blue-900 bg-blue-950/50 px-3 py-1 text-[10px] font-bold text-blue-400 sm:text-xs">{query.results.length} rows returned</span>}
        </div>
        
        <div className="grid overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex flex-col border-b border-slate-800 bg-slate-900/50 p-4 sm:p-5 lg:border-b-0 lg:border-r lg:p-7">
            <div className="mb-4 flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-500 uppercase sm:mb-5 sm:text-xs">
              <span>Generated SQL</span>
              <span className="text-blue-500">read only</span>
            </div>
            <pre className="w-full flex-1 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-4 text-[13px] leading-relaxed text-blue-300 shadow-inner sm:p-5 sm:text-sm sm:leading-7">
              {query?.sql ?? "Your generated SQL will appear here."}
            </pre>
          </div>
          
          <div className="min-h-48 overflow-auto p-0 sm:min-h-72">
            {query && query.results.length > 0 ? (
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <thead className="sticky top-0 z-10 bg-slate-900 shadow-sm">
                  <tr className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase sm:text-xs">
                    {columns.map((column) => (
                      <th key={column} className="whitespace-nowrap border-b border-slate-800 px-4 py-3 first:pl-5 sm:px-6 sm:py-4 sm:first:pl-7">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {query.results.map((row, rowIndex) => (
                    <tr key={rowIndex} className="transition-colors hover:bg-slate-800/50">
                      {columns.map((column) => (
                        <td key={column} className="whitespace-nowrap px-4 py-3 text-slate-300 first:pl-5 sm:px-6 sm:py-4 sm:first:pl-7">
                          {displayValue(row[column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex h-full min-h-48 items-center justify-center p-5 text-center text-xs font-medium text-slate-500 sm:min-h-72 sm:p-7 sm:text-sm">
                Run a question to see the data table.
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}