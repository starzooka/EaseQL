"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";

interface ChatInputProps {
  disabled: boolean;
  sending: boolean;
  error: string;
  onSend: (content: string) => Promise<boolean>;
}

export default function ChatInput({ disabled, sending, error, onSend }: ChatInputProps) {
  const [content, setContent] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent || disabled || sending) return;

    const sent = await onSend(trimmedContent);
    if (sent) setContent("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <form onSubmit={submit} className="p-4 sm:p-6">
      {error ? <p role="alert" className="mb-3 text-xs text-red-300">{error}</p> : null}
      <div className="flex items-end gap-3 rounded-lg border border-slate-700 bg-slate-950 p-2 transition focus-within:border-blue-500/70">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
          rows={2}
          placeholder={disabled ? "Select a chat to continue..." : "Send a message..."}
          aria-label="Send a chat message"
          className="min-h-12 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-6 text-slate-200 placeholder:text-slate-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || sending || !content.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
      <p className="mt-2 text-[10px] text-slate-600">Shift + Enter for a new line</p>
    </form>
  );
}
