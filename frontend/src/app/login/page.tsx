"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import AuthLayout from "@/components/auth/AuthLayout";
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
    <AuthLayout
      eyebrow="Your data, at a glance"
      title="Welcome back"
      description="Query datasets in natural language and pick up where you left off."
      footerPrompt="No account yet?"
      footerLinkLabel="Create your account"
      footerHref="/register"
    >
      <form onSubmit={onSubmit} className="auth-form">
        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="auth-input"
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="auth-input"
            placeholder="Enter your password"
            required
          />
        </label>

        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        <button type="submit" disabled={submitting} className="auth-submit">
          {submitting ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </AuthLayout>
  );
}
