import type {
  Dispatch,
  FormEventHandler,
  SetStateAction,
} from "react";

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
    <div className="flex h-full flex-col border border-[var(--line)] bg-[var(--ink)] p-5 shadow-none sm:p-6">
      <div className="mb-5 flex items-center justify-between sm:mb-6">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[var(--muted)] sm:text-xs">
            02 / Question
          </p>

          <h2 className="mt-1 text-lg font-semibold tracking-tight text-[var(--paper)] sm:text-xl">
            What would you like to know?
          </h2>
        </div>

        <span
          className="text-xl leading-none text-[var(--amber)] sm:text-2xl"
          aria-hidden="true"
        >
          ✦
        </span>
      </div>

      <form
        onSubmit={submitQuestion}
        className="flex flex-1 flex-col"
      >
        <textarea
          value={question}
          onChange={(event) =>
            setQuestion(event.target.value)
          }
          disabled={!tableName || querying}
          placeholder={
            tableName
              ? "e.g. Which region had the highest revenue?"
              : "Upload a CSV to start asking questions..."
          }
          className="min-h-[10rem] w-full flex-1 resize-none border border-[var(--line-strong)] bg-transparent p-4 text-sm leading-relaxed text-[var(--paper)] placeholder:text-[var(--muted)] transition-colors focus:border-[var(--amber)] focus:outline-none focus:ring-1 focus:ring-[rgba(232,163,61,0.2)] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[11rem] sm:p-5 sm:text-base sm:leading-7"
        />

        <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:mt-5 sm:flex-row">
          <span className="text-center text-[10px] text-[var(--muted)] sm:text-left sm:text-xs">
            Answers are limited to 500 rows
          </span>

          <button
            type="submit"
            disabled={
              !tableName ||
              !question.trim() ||
              querying
            }
            className={`w-full border border-[var(--amber)] bg-[var(--amber)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[#f0b04f] disabled:cursor-not-allowed disabled:border-[var(--line)] disabled:bg-[var(--line)] disabled:text-[var(--muted)] sm:w-auto ${
              querying ? "animate-pulse" : ""
            }`}
          >
            {querying ? "Thinking..." : "Run query →"}
          </button>
        </div>
      </form>
    </div>
  );
}
