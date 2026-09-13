"use client";

import type { ChatMessage as ChatMessageData } from "@/lib/api/chatMessages";

interface ChatMessageProps {
  message: ChatMessageData;
  onViewQuery: (historyId: number) => void;
}

const QUERY_HISTORY_MARKER = /\[\[QUERY_HISTORY_ID:\s*(\d+)\s*\]\]/;
const QUERY_HISTORY_MARKER_TEXT = /\[\[QUERY_HISTORY_ID:[^\]]*\]\]/g;

function formatMessageTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function ChatMessage({
  message,
  onViewQuery,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const historyMatch = message.content.match(QUERY_HISTORY_MARKER);
  const historyId = historyMatch
    ? Number(historyMatch[1])
    : null;
  const visibleContent = message.content
    .replace(QUERY_HISTORY_MARKER_TEXT, "")
    .trimEnd();

  return (
    <li
      className={`flex w-full ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <article
        className={[
          "easeql-message",
          "transition-colors",
          isUser
            ? "easeql-message--user"
            : isSystem
              ? "easeql-message--system"
              : "easeql-message--assistant",
        ].join(" ")}
      >
        <div
          className={`flex items-center gap-2 ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          <span
            className={`text-[9px] font-semibold tracking-[0.12em] uppercase ${
              isUser
                ? "text-[var(--user-chat)] brightness-160"
                : isSystem
                  ? "text-[var(--muted)]"
                  : "text-[var(--amber)]"
            }`}
          >
            {isUser
              ? "You"
              : isSystem
                ? "System"
                : "EaseQL"}
          </span>

          <time
            dateTime={message.created_at}
            className="text-[9px] text-[var(--muted)]"
          >
            {formatMessageTime(message.created_at)}
          </time>
        </div>

        <p className="mt-1 whitespace-pre-wrap text-[13px] leading-5">
          {visibleContent}
        </p>

        {!isUser && !isSystem && historyId !== null ? (
          <button
            type="button"
            onClick={() => onViewQuery(historyId)}
            aria-label="View the saved query result for this response"
            className="mt-2 border-b border-[var(--amber)]/60 pb-0.5 text-left text-[12px] text-[var(--amber)] transition-colors hover:border-[var(--amber)] hover:text-[var(--paper)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--amber)]"
          >
            Generated SQL → View query
          </button>
        ) : null}
      </article>
    </li>
  );
}
