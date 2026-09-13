"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import AuthLayout from "@/components/auth/AuthLayout";
import { useAuth } from "@/components/auth/useAuth";

type PasswordStrength = "Weak" | "Medium" | "Strong";

const getPasswordChecks = (value: string) => ({
  length: value.length >= 8 && value.length < 16,
  uppercase: /[A-Z]/.test(value),
  lowercase: /[a-z]/.test(value),
  numeric: /\d/.test(value),
  special: /[^A-Za-z0-9]/.test(value),
});

const getPasswordStrength = (value: string): PasswordStrength => {
  if (!value) {
    return "Weak";
  }

  const checks = getPasswordChecks(value);
  const passedChecks = Object.values(checks).filter(Boolean).length;

  if (passedChecks === 5) {
    return "Strong";
  }

  if (passedChecks >= 3) {
    return "Medium";
  }

  return "Weak";
};

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const passwordChecks = useMemo(
    () => getPasswordChecks(password),
    [password]
  );

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password]
  );

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, loading, router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (passwordStrength !== "Strong") {
      setError(
        "Please choose a Strong password that meets all the requirements."
      );
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
      setError(
        registerError instanceof Error
          ? registerError.message
          : "Registration failed."
      );
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
        {/* Email */}
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

        {/* Password */}
        <div className="auth-field">
          <label htmlFor="register-password">Password</label>

          <div className="password-input-wrapper">
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="auth-input password-input"
              placeholder="Create a strong password"
              minLength={8}
              maxLength={15}
              required
              aria-describedby="password-requirements"
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Password strength and requirements */}
          <div
            id="password-requirements"
            className={`password-strength password-strength--${passwordStrength.toLowerCase()}`}
            aria-live="polite"
          >
            <div className="password-strength__header">
              <span>Password strength</span>

              <strong>{passwordStrength}</strong>
            </div>

            <ul className="password-requirements">
              <li className={passwordChecks.length ? "is-valid" : ""}>
                <span aria-hidden="true">
                  {passwordChecks.length ? "✓" : "○"}
                </span>
                8–15 characters
              </li>

              <li className={passwordChecks.uppercase ? "is-valid" : ""}>
                <span aria-hidden="true">
                  {passwordChecks.uppercase ? "✓" : "○"}
                </span>
                At least one uppercase character
              </li>

              <li className={passwordChecks.lowercase ? "is-valid" : ""}>
                <span aria-hidden="true">
                  {passwordChecks.lowercase ? "✓" : "○"}
                </span>
                At least one lowercase character
              </li>

              <li className={passwordChecks.numeric ? "is-valid" : ""}>
                <span aria-hidden="true">
                  {passwordChecks.numeric ? "✓" : "○"}
                </span>
                At least one numeric character
              </li>

              <li className={passwordChecks.special ? "is-valid" : ""}>
                <span aria-hidden="true">
                  {passwordChecks.special ? "✓" : "○"}
                </span>
                At least one special character
              </li>
            </ul>
          </div>
        </div>

        {/* Confirm password */}
        <div className="auth-field">
          <label htmlFor="confirm-password">Confirm password</label>

          <div className="password-input-wrapper">
            <input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="auth-input password-input"
              placeholder="Repeat your password"
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowConfirmPassword((current) => !current)
              }
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error ? (
          <p className="auth-error" role="alert">
            {error}
          </p>
        ) : null}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || passwordStrength !== "Strong"}
          className="auth-submit"
        >
          {submitting ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </AuthLayout>
  );
}