"use client";

interface NewChatButtonProps {
  creating: boolean;
  onCreate: () => void;
  collapsed: boolean;
}

export default function NewChatButton({
  creating,
  onCreate,
  collapsed,
}: NewChatButtonProps) {
  return (
    <button
      type="button"
      onClick={onCreate}
      disabled={creating}
      className={`easeql-new-chat${
        collapsed ? " is-collapsed" : ""
      }`}
      title={
        collapsed
          ? "New chat"
          : undefined
      }
      aria-label="Create new chat"
    >
      <span
        className="easeql-new-chat-symbol"
        aria-hidden="true"
      >
        +
      </span>

      <span className="easeql-new-chat-label">
        {creating
          ? "Creating…"
          : " New chat"}
      </span>
    </button>
  );
}