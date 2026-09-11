"use client";

import type { ChatMessage as ChatMessageData } from "@/lib/api/chatMessages";
import ChatMessage from "./ChatMessage";

interface ChatMessagesProps {
  messages: ChatMessageData[];
  loading: boolean;
  thinking: boolean;
  error: string;
}

function sortChronologically(
  messages: ChatMessageData[]
) {
  return [...messages].sort((left, right) => {
    const timeDifference =
      Date.parse(left.created_at) -
      Date.parse(right.created_at);

    return (
      timeDifference ||
      left.id - right.id
    );
  });
}

export default function ChatMessages({
  messages,
  loading,
  thinking,
  error,
}: ChatMessagesProps) {
  const orderedMessages =
    sortChronologically(messages);

  return (
    <div className="bg-[var(--ink)]">
      {/* Conversation heading */}
      <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[var(--amber)]"
          >
            02 / Conversation
          </span>

          <span className="text-[var(--line-strong)]">
            /
          </span>

          <span className="text-[10px] tracking-[0.08em] uppercase text-[var(--muted)]">
            Ask in context
          </span>
        </div>

        <span
          aria-hidden="true"
          className="text-sm text-[var(--line-strong)]"
        >
          ✦
        </span>
      </div>

      {/* Error */}
      {error ? (
        <div
          role="alert"
          className="mx-4 mt-3 border-l-2 border-[var(--danger)] bg-[rgba(217,107,95,0.06)] px-3 py-2 text-xs leading-5 text-[var(--danger)] sm:mx-5"
        >
          {error}
        </div>
      ) : null}

      {/* Messages */}
      <div className="max-h-[24rem] min-h-[11rem] overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
        {loading ? (
          <div
            className="space-y-2"
            aria-label="Loading conversation"
          >
            <div className="h-10 w-2/5 animate-pulse bg-[var(--line)]" />
            <div className="ml-auto h-10 w-1/3 animate-pulse bg-[var(--line)]" />
            <div className="h-12 w-1/2 animate-pulse bg-[var(--line)]" />
          </div>
        ) : orderedMessages.length === 0 &&
          !thinking ? (
          <div className="flex min-h-[11rem] items-center justify-center text-center">
            <p className="max-w-sm text-xs leading-5 text-[var(--muted)]">
              Your questions and answers will
              appear here.
            </p>
          </div>
        ) : (
          <ul
            className="space-y-2.5"
            aria-live="polite"
            aria-label="Conversation messages"
          >
            {orderedMessages.map(
              (message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                />
              )
            )}

            {thinking ? (
              <li
                className="flex justify-start"
                aria-label="EaseQL is thinking"
              >
                <div className="flex items-center gap-2 bg-[rgba(237,234,226,0.045)] px-3 py-2 text-[11px] text-[var(--muted)]">
                  <span>Thinking</span>

                  <span
                    className="flex gap-1"
                    aria-hidden="true"
                  >
                    <span className="h-1 w-1 animate-pulse rounded-full bg-[var(--amber)]" />
                    <span className="h-1 w-1 animate-pulse rounded-full bg-[var(--amber)] [animation-delay:150ms]" />
                    <span className="h-1 w-1 animate-pulse rounded-full bg-[var(--amber)] [animation-delay:300ms]" />
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