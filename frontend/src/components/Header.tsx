"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/useAuth";

interface HeaderProps {
  onOpenPreferences: () => void;
  sessionTitle: string;
  datasetLabel: string;
}

export default function Header({ onOpenPreferences, sessionTitle, datasetLabel }: HeaderProps) {
  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();

  const handleSignOut = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="border-b border-slate-800/80 pb-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 items-center gap-2 text-xs font-bold tracking-widest text-blue-500 uppercase">
            <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-blue-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            </span>
            EaseQL
          </div>
          <span className="text-slate-700">/</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{sessionTitle}</p>
            <p className="mt-0.5 truncate text-[10px] tracking-wider text-slate-500 uppercase">Active session</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="max-w-48 truncate rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase" title={datasetLabel}>
            {datasetLabel}
          </div>
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenPreferences}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-blue-500 hover:text-blue-200"
              >
                Preferences
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-blue-500 hover:text-blue-200"
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