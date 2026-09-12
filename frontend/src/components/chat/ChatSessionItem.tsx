"use client";

import type { ChatSession } from "@/lib/api/chatSessions";

interface ChatSessionItemProps {
  session: ChatSession;
  selected: boolean;
  deleting: boolean;
  onSelect: (sessionId: number) => void;
  onDelete: (sessionId: number) => void;
  collapsed: boolean;
}

function formatUpdatedDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function ChatSessionItem({
  session,
  selected,
  deleting,
  onSelect,
  onDelete,
  collapsed,
}: ChatSessionItemProps) {
  const title =
    session.title?.trim() || "Untitled chat";

  const initial =
    title.charAt(0).toUpperCase() || "U";

  return (
    <li>
      <div
        className="easeql-chat-session group"
        style={{
          borderBottom:
            "1px solid var(--line)",
        }}
      >
        <button
          type="button"
          onClick={() => onSelect(session.id)}
          className="easeql-chat-session-button"
          aria-current={
            selected ? "page" : undefined
          }
          title={collapsed ? title : undefined}
        >
          <span
            className="easeql-chat-session-title"
            style={{
              color: selected
                ? "var(--amber)"
                : "var(--paper)",
            }}
          >
            {collapsed ? initial : title}
          </span>

          <span
            className={`easeql-chat-session-date${
              collapsed
                ? " session-date-hidden"
                : ""
            }`}
          >
            {formatUpdatedDate(
              session.updated_at
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(session.id)}
          disabled={deleting}
          aria-label={`Delete ${title}`}
          className="easeql-chat-delete"
        >
          ×
        </button>
      </div>
    </li>
  );
}