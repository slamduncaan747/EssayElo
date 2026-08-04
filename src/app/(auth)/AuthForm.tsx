"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { AuthState } from "./actions";
import { resendConfirmation } from "./actions";
import Icon from "@/components/Icon";

export type AuthMode = "login" | "signup" | "forgot" | "reset";

const COPY: Record<AuthMode, { title: string; blurb: string; submit: string; pending: string }> = {
  login: {
    title: "Welcome back",
    blurb: "Log in to your essays and scores.",
    submit: "Log in",
    pending: "Logging in…",
  },
  signup: {
    title: "Score your first essay",
    blurb: "3 free evaluations a month. No card required.",
    submit: "Create account",
    pending: "Creating account…",
  },
  forgot: {
    title: "Reset your password",
    blurb: "We'll email you a link to choose a new one.",
    submit: "Send reset link",
    pending: "Sending…",
  },
  reset: {
    title: "Choose a new password",
    blurb: "Pick something at least 8 characters long.",
    submit: "Save password",
    pending: "Saving…",
  },
};

function Banner({ kind, children }: { kind: "error" | "ok"; children: React.ReactNode }) {
  return (
    <div className={`auth-banner auth-banner-${kind}`} role={kind === "error" ? "alert" : "status"}>
      <Icon name={kind === "error" ? "info" : "check"} size={16} strokeWidth={2.6} />
      <span>{children}</span>
    </div>
  );
}

export default function AuthForm({
  mode,
  action,
  next,
  initialError,
}: {
  mode: AuthMode;
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  next?: string;
  /** Error handed over from /auth/callback (expired link, etc.). */
  initialError?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [resendState, resendAction, resending] = useActionState(resendConfirmation, {});
  const [email, setEmail] = useState("");
  const copy = COPY[mode];

  const wantsEmail = mode !== "reset";
  const wantsPassword = mode !== "forgot";
  const error = state.error ?? initialError;

  return (
    <div className="auth-wrap">
      <div style={{ width: "100%", maxWidth: 430 }}>
        <Link
          href="/"
          className="logo"
          style={{ justifyContent: "center", marginBottom: "var(--s6)", padding: 0 }}
        >
          <span className="logo-mark">M</span>
          <span className="logo-name">Margin</span>
        </Link>

        <form action={formAction} className="auth-card">
          <div className="stack g2">
            <h1 className="h1">{copy.title}</h1>
            <p className="small">{copy.blurb}</p>
          </div>

          {next ? <input type="hidden" name="next" value={next} /> : null}

          <div className="stack g4">
            {wantsEmail ? (
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            ) : null}

            {wantsPassword ? (
              <div className="field">
                <div className="spread">
                  <label htmlFor="password">
                    {mode === "reset" ? "New password" : "Password"}
                  </label>
                  {mode === "login" ? (
                    <Link href="/forgot-password" className="auth-link-quiet">
                      Forgot?
                    </Link>
                  ) : null}
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  minLength={mode === "login" ? undefined : 8}
                  required
                />
              </div>
            ) : null}

            {mode === "reset" ? (
              <div className="field">
                <label htmlFor="confirm">Confirm new password</label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
            ) : null}
          </div>

          {error ? <Banner kind="error">{error}</Banner> : null}
          {state.message ? <Banner kind="ok">{state.message}</Banner> : null}

          <button className="btn btn-primary btn-block btn-xl" disabled={pending}>
            {pending ? copy.pending : copy.submit}
          </button>

          <p className="small center">
            {mode === "login" ? (
              <>
                New to Margin?{" "}
                <Link href="/signup" className="auth-link">
                  Create an account
                </Link>
              </>
            ) : mode === "signup" ? (
              <>
                Already have an account?{" "}
                <Link href="/login" className="auth-link">
                  Log in
                </Link>
              </>
            ) : (
              <Link href="/login" className="auth-link">
                Back to log in
              </Link>
            )}
          </p>
        </form>

        {/* Kept outside the form above — nested forms are invalid HTML. */}
        {state.needsConfirmation ? (
          <form action={resendAction} className="auth-aside">
            <input type="hidden" name="email" value={email} />
            <span className="small">Didn&apos;t get the confirmation email?</span>
            <button className="btn btn-plain btn-sm" disabled={resending}>
              {resending ? "Sending…" : "Resend it"}
            </button>
            {resendState.message ? (
              <span className="tiny" style={{ color: "var(--green-ink)" }}>
                {resendState.message}
              </span>
            ) : null}
            {resendState.error ? (
              <span className="tiny" style={{ color: "var(--red-ink)" }}>
                {resendState.error}
              </span>
            ) : null}
          </form>
        ) : null}
      </div>
    </div>
  );
}
