"use client";

interface NewChatButtonProps {
  creating: boolean;
  onCreate: () => void;
}

export default function NewChatButton({ creating, onCreate }: NewChatButtonProps) {
  return (
    <button
      type="button"
      onClick={onCreate}
      disabled={creating}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500/40 bg-blue-600/10 px-3 py-2.5 text-sm font-semibold text-blue-200 transition hover:border-blue-400 hover:bg-blue-500/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span aria-hidden="true" className="text-lg leading-none">+</span>
      {creating ? "Creating..." : "New chat"}
    </button>
  );
}
