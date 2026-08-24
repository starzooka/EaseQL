import type { Dispatch, FormEventHandler, SetStateAction } from "react";

export interface QueryFormProps {
  tableName: string;
  question: string;
  setQuestion: Dispatch<SetStateAction<string>>;
  querying: boolean;
  submitQuestion: FormEventHandler<HTMLFormElement>;
}

export default function QueryForm({
  tableName,
  question,
  setQuestion,
  querying,
  submitQuestion,
}: QueryFormProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg transition-all duration-300 hover:border-slate-700 sm:p-7">
      <div className="mb-5 flex items-center justify-between sm:mb-6">
        <div>
          <p className="text-[10px] font-semibold tracking-wider text-blue-500 uppercase sm:text-xs">02 / Question</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-white sm:mt-1.5 sm:text-xl">What would you like to know?</h2>
        </div>
        <span className="text-xl text-slate-600 sm:text-2xl">✦</span>
      </div>
      
      <form onSubmit={submitQuestion} className="flex flex-1 flex-col">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={!tableName || querying}
          placeholder={tableName ? "e.g. Which region had the highest revenue?" : "Upload a CSV to start asking questions..."}
          className="min-h-[12rem] w-full flex-1 resize-none rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm leading-relaxed text-slate-200 placeholder:text-slate-600 transition-all duration-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[14rem] sm:p-5 sm:text-base sm:leading-7"
        />
        <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:mt-5 sm:flex-row">
          <span className="text-center text-[10px] text-slate-500 sm:text-left sm:text-xs">Answers are limited to 500 rows</span>
          <button
            type="submit"
            disabled={!tableName || !question.trim() || querying}
            className={`w-full rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-500 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 sm:w-auto ${querying ? "animate-pulse" : ""}`}
          >
            {querying ? "Thinking..." : "Run query  →"}
          </button>
        </div>
      </form>
    </div>
  );
}