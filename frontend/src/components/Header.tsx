"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/useAuth";

interface HeaderProps {
  onOpenPreferences: () => void;
  sessionTitle: string;
  datasetLabel: string;
}

export default function Header({
  onOpenPreferences,
  sessionTitle,
  datasetLabel,
}: HeaderProps) {
  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();

  const handleSignOut = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="border-b border-[var(--line)] pb-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 items-center gap-2 text-xs font-semibold tracking-[0.16em] uppercase text-[var(--amber)]">
            <span
              className="flex h-2.5 w-2.5 items-center justify-center border border-[rgba(232,163,61,0.35)]"
              aria-hidden="true"
            >
              <span className="h-1.5 w-1.5 bg-[var(--amber)]" />
            </span>

            EaseQL
          </div>

          <span className="text-[var(--line-strong)]">/</span>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--paper)]">
              {sessionTitle}
            </p>

            <p className="mt-0.5 truncate text-[10px] tracking-[0.12em] uppercase text-[var(--muted)]">
              Active session
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="max-w-48 truncate border border-[var(--line)] bg-transparent px-3 py-2 text-[10px] font-semibold tracking-[0.1em] uppercase text-[var(--teal)]"
            title={datasetLabel}
          >
            {datasetLabel}
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenPreferences}
                className="border border-[var(--line-strong)] bg-transparent px-3 py-2 text-xs font-medium text-[var(--paper)] transition-colors hover:border-[var(--amber)] hover:text-[var(--amber)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--amber)]"
              >
                Preferences
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="border border-[var(--line-strong)] bg-transparent px-3 py-2 text-xs font-medium text-[var(--muted)] transition-colors hover:border-[var(--amber)] hover:text-[var(--amber)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--amber)]"
              >
                Sign Out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
