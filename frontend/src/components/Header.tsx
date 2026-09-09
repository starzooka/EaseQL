"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/useAuth";

export default function Header() {
  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();

  const handleSignOut = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="flex flex-col items-center justify-center gap-5 text-center sm:gap-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-blue-500 uppercase sm:text-sm">
          <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-blue-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          </span>
          EaseQL
        </div>
        <div className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          DuckDB Powered
        </div>
      </div>

      <div className="flex items-center gap-3">
        <h1 className="max-w-3xl text-4xl leading-[1.1] font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Ask your data<br />
          <span className="text-blue-500">better questions.</span>
        </h1>

        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-blue-500 hover:text-blue-200"
          >
            Sign Out
          </button>
        ) : null}
      </div>

      <p className="max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base sm:leading-7">
        Drop in a dataset, then explore it with plain language. SQL stays visible so every answer is easy to trust.
      </p>
    </header>
  );
}