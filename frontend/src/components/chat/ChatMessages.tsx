"use client";

import type { ChatMessage as ChatMessageData } from "@/lib/api/chatMessages";
import ChatMessage from "./ChatMessage";

interface ChatMessagesProps {
  messages: ChatMessageData[];
  loading: boolean;
  thinking: boolean;
  error: string;
}

function sortChronologically(messages: ChatMessageData[]) {
  return [...messages].sort((left, right) => {
    const timeDifference = Date.parse(left.created_at) - Date.parse(right.created_at);
    return timeDifference || left.id - right.id;
  });
}

export default function ChatMessages({ messages, loading, thinking, error }: ChatMessagesProps) {
  const orderedMessages = sortChronologically(messages);

  return (
    <div className="border-b border-slate-800/80 p-4 sm:p-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-blue-500 uppercase">02 / Conversation</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-white">Ask in context</h2>
        </div>
        <span aria-hidden="true" className="text-lg text-slate-700">✦</span>
      </div>

      {error ? (
        <div role="alert" className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-xs leading-5 text-red-200">
          {error}
        </div>
      ) : null}

      <div className="max-h-[28rem] min-h-32 overflow-y-auto pr-1">
        {loading ? (
          <div className="space-y-3" aria-label="Loading conversation">
            <div className="h-16 w-4/5 animate-pulse rounded-xl bg-slate-900" />
            <div className="ml-auto h-16 w-3/5 animate-pulse rounded-xl bg-slate-900" />
          </div>
        ) : orderedMessages.length === 0 && !thinking ? (
          <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-slate-800 px-4 text-center">
            <p className="text-xs leading-5 text-slate-500">Your questions and answers will appear here.</p>
          </div>
        ) : (
          <ul className="space-y-3" aria-live="polite" aria-label="Conversation messages">
            {orderedMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {thinking ? (
              <li className="flex justify-start" aria-label="EaseQL is thinking">
                <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    Thinking
                    <span className="flex gap-1" aria-hidden="true">
                      <span className="h-1 w-1 animate-pulse rounded-full bg-blue-400" />
                      <span className="h-1 w-1 animate-pulse rounded-full bg-blue-400 [animation-delay:150ms]" />
                      <span className="h-1 w-1 animate-pulse rounded-full bg-blue-400 [animation-delay:300ms]" />
                    </span>
                  </span>
                </div>
              </li>
            ) : null}
          </ul>
        )}
      </div>
    </div>
  );
}
