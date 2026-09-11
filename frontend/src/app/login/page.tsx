"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, loading, router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      router.replace("/");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--ink)] text-[var(--paper)] antialiased">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-12">
        <section className="w-full rounded-2xl border border-[var(--line-strong)]/60 bg-[var(--ink)] p-7 shadow-none backdrop-blur">
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[var(--amber)]">EaseQL Access</p>
          <h1 className="mb-1 text-3xl font-semibold tracking-tight text-[var(--paper)]">Welcome Back</h1>
          <p className="mb-6 text-sm text-[var(--muted)]">Sign in to continue querying your datasets.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block text-sm text-[var(--paper)]">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ink)] px-3 py-2.5 text-[var(--paper)] outline-none ring-0 transition focus:border-[var(--amber)]"
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="block text-sm text-[var(--paper)]">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ink)] px-3 py-2.5 text-[var(--paper)] outline-none ring-0 transition focus:border-[var(--amber)]"
                placeholder="••••••••"
                required
              />
            </label>

            {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[var(--amber)] px-4 py-2.5 text-sm font-medium text-[var(--paper)] transition hover:bg-[#f0b04f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-5 text-sm text-[var(--muted)]">
            No account yet?{" "}
            <Link href="/register" className="text-[var(--amber)] hover:text-[var(--amber)]">
              Create one
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
