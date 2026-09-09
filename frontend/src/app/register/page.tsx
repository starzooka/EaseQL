"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/useAuth";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await register(email, password);
      router.replace("/");
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0f1b] text-slate-200 antialiased">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-12">
        <section className="w-full rounded-2xl border border-slate-700/60 bg-slate-900/80 p-7 shadow-[0_0_0_1px_rgba(59,130,246,0.16),0_18px_60px_-26px_rgba(59,130,246,0.65)] backdrop-blur">
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-blue-300">EaseQL Access</p>
          <h1 className="mb-1 text-3xl font-semibold tracking-tight text-slate-100">Create Account</h1>
          <p className="mb-6 text-sm text-slate-400">Get started with secure querying and saved sessions.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block text-sm text-slate-300">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-600 bg-slate-950/80 px-3 py-2.5 text-slate-100 outline-none ring-0 transition focus:border-blue-400"
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="block text-sm text-slate-300">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-600 bg-slate-950/80 px-3 py-2.5 text-slate-100 outline-none ring-0 transition focus:border-blue-400"
                placeholder="At least 8 characters"
                required
              />
            </label>

            <label className="block text-sm text-slate-300">
              Confirm Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-600 bg-slate-950/80 px-3 py-2.5 text-slate-100 outline-none ring-0 transition focus:border-blue-400"
                placeholder="Repeat your password"
                required
              />
            </label>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-400">
            Already registered?{" "}
            <Link href="/login" className="text-blue-300 hover:text-blue-200">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
