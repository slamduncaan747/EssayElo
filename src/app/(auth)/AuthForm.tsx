"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "./actions";
import Icon from "@/components/Icon";

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
            <h1 className="h1">{isLogin ? "Welcome back" : "Score your first essay"}</h1>
            <p className="small">
              {isLogin
                ? "Log in to your essays and scores."
                : "3 free evaluations a month. No card required."}
            </p>
          </div>

          {next ? <input type="hidden" name="next" value={next} /> : null}

          <div className="stack g4">
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
          </div>

          {state.error ? <p className="error-text">{state.error}</p> : null}
          {state.message ? (
            <p
              className="small row g2"
              style={{ color: "var(--green-ink)" }}
            >
              <Icon name="check" size={16} strokeWidth={2.6} />
              {state.message}
            </p>
          ) : null}

          <button className="btn btn-primary btn-block btn-xl" disabled={pending}>
            {pending ? "One moment…" : isLogin ? "Log in" : "Create account"}
          </button>

          <p className="small center">
            {isLogin ? (
              <>
                New to Margin?{" "}
                <Link href="/signup" style={{ color: "var(--brand)", fontWeight: 800 }}>
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/login" style={{ color: "var(--brand)", fontWeight: 800 }}>
                  Log in
                </Link>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
