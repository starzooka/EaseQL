"use client";

import type { ChatMessage as ChatMessageData } from "@/lib/api/chatMessages";

interface ChatMessageProps {
  message: ChatMessageData;
}

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
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

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
          {message.content}
        </p>
      </article>
    </li>
  );
}
