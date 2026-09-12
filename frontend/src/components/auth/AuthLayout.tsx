"use client";

import type { ReactNode } from "react";

import Link from "next/link";

type AuthLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footerPrompt: string;
  footerLinkLabel: string;
  footerHref: "/login" | "/register";
};

export default function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  footerPrompt,
  footerLinkLabel,
  footerHref,
}: AuthLayoutProps) {
  return (
    <main className="auth-page">
      <div className="auth-page__glow" aria-hidden="true" />
      <div className="auth-shell">
        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-brand" aria-label="EaseQL">
            <span className="auth-brand__mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="auth-brand__name">EaseQL</span>
          </div>

          <div className="auth-heading">
            <p className="auth-eyebrow">{eyebrow}</p>
            <h1 id="auth-title">{title}</h1>
            <p>{description}</p>
          </div>

          {children}

          <div className="auth-footer">
            <p>
              {footerPrompt}{" "}
              <Link href={footerHref}>{footerLinkLabel}</Link>
            </p>
            <p className="auth-trust">
              <span aria-hidden="true">&#9670;</span>
              Secure access to your datasets.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
