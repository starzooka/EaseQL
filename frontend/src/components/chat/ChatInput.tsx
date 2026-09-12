"use client";

import {
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

interface ChatInputProps {
  disabled: boolean;
  sending: boolean;
  error: string;
  onSend: (content: string) => Promise<boolean>;
}

export default function ChatInput({
  disabled,
  sending,
  error,
  onSend,
}: ChatInputProps) {
  const [content, setContent] = useState("");

  const submit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (
      !trimmedContent ||
      disabled ||
      sending
    ) {
      return;
    }

    const sent = await onSend(
      trimmedContent
    );

    if (sent) {
      setContent("");
    }
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const sendDisabled =
    disabled ||
    sending ||
    !content.trim();

  return (
    <form
      onSubmit={submit}
      className="border-t border-[var(--line)] bg-[var(--ink)] px-3 py-3 sm:px-4"
    >
      {error ? (
        <p
          role="alert"
          className="mb-2 px-1 text-xs text-[var(--danger)]"
        >
          {error}
        </p>
      ) : null}

      <div
        className="
          flex items-center gap-2
          border border-[var(--line-strong)]
          bg-[var(--ink)]
          px-3 py-2
          transition-colors
          focus-within:border-[var(--amber)]
        "
      >
        <span
          aria-hidden="true"
          className="select-none text-sm text-[var(--amber)]"
        >
          ›
        </span>

        <textarea
          value={content}
          onChange={(event) =>
            setContent(event.target.value)
          }
          onKeyDown={handleKeyDown}
          disabled={
            disabled || sending
          }
          rows={1}
          placeholder={
            disabled
              ? "Select a chat to continue..."
              : "Send a message..."
          }
          aria-label="Send a chat message"
          className="
            min-h-9
            max-h-28
            flex-1
            resize-none
            bg-transparent
            py-1
            text-sm
            leading-6
            text-[var(--paper)]
            placeholder:text-[var(--muted)]
            focus:outline-none
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        />

        <button
          type="submit"
          disabled={sendDisabled}
          aria-label={
            sending
              ? "Sending message"
              : "Send message"
          }
          title={
            sending
              ? "Sending..."
              : "Send message"
          }
          className="
            flex h-9 w-9 shrink-0
            items-center justify-center
            border border-[var(--amber)]
            bg-[var(--amber)]
            p-0
            text-[var(--ink)]
            transition-colors
            hover:bg-[#f0b04f]
            focus:outline-none
            focus-visible:ring-1
            focus-visible:ring-[var(--amber)]
            disabled:cursor-not-allowed
            disabled:border-[var(--line)]
            disabled:bg-[var(--line)]
            disabled:text-[var(--muted)]
          "
        >
          {sending ? (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="2"
                opacity="0.3"
              />

              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h13" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          )}
        </button>
      </div>

      <p className="mt-1.5 px-1 text-[9px] text-[var(--muted)]">
        Shift + Enter for a new line
      </p>
    </form>
  );
}