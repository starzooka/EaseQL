"use client";

import type { ChatSession } from "@/lib/api/chatSessions";

interface ChatSessionItemProps {
  session: ChatSession;
  selected: boolean;
  deleting: boolean;
  onSelect: (sessionId: number) => void;
  onDelete: (sessionId: number) => void;
}

function formatUpdatedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently updated";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function ChatSessionItem({
  session,
  selected,
  deleting,
  onSelect,
  onDelete,
}: ChatSessionItemProps) {
  return (
    <li>
      <div
        className={`group flex items-center gap-2 rounded-lg border p-2 transition-colors ${
          selected
            ? "border-blue-500/50 bg-blue-500/10"
            : "border-transparent hover:border-slate-800 hover:bg-slate-900"
        }`}
      >
        <button
          type="button"
          onClick={() => onSelect(session.id)}
          className="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
          aria-current={selected ? "page" : undefined}
        >
          <span className={`block truncate text-sm font-medium ${selected ? "text-blue-100" : "text-slate-200"}`}>
            {session.title?.trim() || "Untitled chat"}
          </span>
          <span className="mt-1 block text-[11px] text-slate-500">{formatUpdatedDate(session.updated_at)}</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(session.id)}
          disabled={deleting}
          aria-label={`Delete ${session.title?.trim() || "untitled chat"}`}
          className="rounded-md p-1.5 text-slate-600 opacity-0 transition hover:bg-red-500/10 hover:text-red-300 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path d="M4 6h12M8 6V4h4v2m-6 0 .7 10h6.6L14 6M8.5 9v4m3-4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </li>
  );
}
