"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "./actions";

export default function AuthForm({
  mode,
  action,
  next,
}: {
  mode: "login" | "signup";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const isLogin = mode === "login";

  return (
    <div className="auth-wrap">
      <div style={{ width: "100%", maxWidth: 400 }}>
        <Link href="/" className="logo" style={{ justifyContent: "center", marginBottom: 22 }}>
          <div className="logo-mark" style={{ width: 28, height: 28, fontSize: 16 }}>M</div>
          <span className="logo-name" style={{ fontSize: 21 }}>Margin</span>
        </Link>
        <form action={formAction} className="auth-card">
          <div>
            <h1 style={{ margin: 0, font: "500 24px var(--serif)" }}>
              {isLogin ? "Welcome back" : "Score your first essay"}
            </h1>
            <p style={{ margin: "6px 0 0", font: "400 13px var(--sans)", color: "var(--muted)" }}>
              {isLogin
                ? "Log in to your essays and scores."
                : "3 free evaluations a month. No card required."}
            </p>
          </div>
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={isLogin ? undefined : 8}
              required
            />
          </div>
          {state.error ? <p className="error-text" style={{ margin: 0 }}>{state.error}</p> : null}
          {state.message ? (
            <p style={{ margin: 0, font: "400 13px var(--sans)", color: "var(--green)" }}>
              {state.message}
            </p>
          ) : null}
          <button className="btn btn-dark" disabled={pending} style={{ width: "100%", padding: "13px 0" }}>
            {pending ? "One moment…" : isLogin ? "Log in" : "Create account"}
          </button>
          <p style={{ margin: 0, font: "400 12.5px var(--sans)", color: "var(--muted)", textAlign: "center" }}>
            {isLogin ? (
              <>New to Margin? <Link href="/signup" style={{ color: "var(--accent)", fontWeight: 600 }}>Create an account</Link></>
            ) : (
              <>Already have an account? <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>Log in</Link></>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
