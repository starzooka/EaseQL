"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import AuthLayout from "@/components/auth/AuthLayout";
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
    <AuthLayout
      eyebrow="A clearer way to explore"
      title="Create your account"
      description="Ask natural-language questions, save useful sessions, and understand your data faster."
      footerPrompt="Already registered?"
      footerLinkLabel="Sign in"
      footerHref="/login"
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
            placeholder="At least 8 characters"
            required
          />
        </label>

        <label className="auth-field">
          <span>Confirm password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="auth-input"
            placeholder="Repeat your password"
            required
          />
        </label>

        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        <button type="submit" disabled={submitting} className="auth-submit">
          {submitting ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </AuthLayout>
  );
}
