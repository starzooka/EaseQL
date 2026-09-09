"use client";

import type { UserMemory } from "@/lib/api/memories";

interface MemoryItemProps {
  memory: UserMemory;
  deleting: boolean;
  onEdit: (memory: UserMemory) => void;
  onDelete: (memoryId: number) => void;
}

function formatExpiration(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Expiration date unavailable";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function MemoryItem({ memory, deleting, onEdit, onDelete }: MemoryItemProps) {
  const expiration = formatExpiration(memory.expires_at);

  return (
    <li className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{memory.value}</p>
          {expiration ? <p className="mt-2 text-[11px] text-slate-500">Expires {expiration}</p> : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(memory)}
            className="rounded-md px-2 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(memory.id)}
            disabled={deleting}
            className="rounded-md px-2 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </li>
  );
}
