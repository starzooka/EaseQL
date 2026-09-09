"use client";

import type { ChatMessage as ChatMessageData } from "@/lib/api/chatMessages";

interface ChatMessageProps {
  message: ChatMessageData;
}

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <li className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <article
        className={`max-w-[88%] rounded-xl border px-4 py-3 sm:max-w-[76%] ${
          isUser
            ? "border-blue-500/30 bg-blue-600/15 text-blue-50"
            : isSystem
              ? "border-slate-800 bg-slate-900/70 text-slate-400"
              : "border-slate-800 bg-slate-900 text-slate-200"
        }`}
      >
        <div className="mb-1 flex items-center justify-between gap-4">
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            {isUser ? "You" : isSystem ? "System" : "EaseQL"}
          </span>
          <time dateTime={message.created_at} className="text-[10px] text-slate-600">
            {formatMessageTime(message.created_at)}
          </time>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
      </article>
    </li>
  );
}
