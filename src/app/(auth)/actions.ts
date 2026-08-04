"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  message?: string;
  /** Set when the account exists but its email was never confirmed, so the
   *  form can offer to resend rather than leaving the user stuck. */
  needsConfirmation?: boolean;
}

function safeNext(raw: FormDataEntryValue | null): string {
  const v = typeof raw === "string" ? raw : "";
  // Internal paths only — prevents open redirects.
  return v.startsWith("/") && !v.startsWith("//") ? v : "/dashboard";
}

/**
 * The origin to build email links against.
 *
 * Derived from the request rather than a build-time env var so preview
 * deployments send links back to themselves instead of production. Falls back
 * to NEXT_PUBLIC_APP_URL when headers are unavailable.
 */
async function appOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required" };

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Collapsing every failure into "invalid email or password" hides the most
    // common real cause — an account that exists but was never confirmed —
    // and leaves the user retrying a password that is actually correct.
    if (/email not confirmed|not confirmed/i.test(error.message)) {
      return {
        error: "Your email address hasn't been confirmed yet.",
        needsConfirmation: true,
      };
    }
    if (/rate limit|too many/i.test(error.message)) {
      return { error: "Too many attempts. Wait a minute and try again." };
    }
    return { error: "Invalid email or password" };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid email" };
  if (password.length < 8) return { error: "Password must be at least 8 characters" };

  const supabase = await supabaseServer();
  const origin = await appOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Without this, the confirmation link points at whatever Site URL is
    // configured in the Supabase dashboard — which on a fresh project is
    // localhost, so every confirmation email from production is a dead link.
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    if (/already registered|already been registered/i.test(error.message)) {
      return { error: "That email already has an account. Log in instead." };
    }
    return { error: error.message };
  }

  // If email confirmation is enabled, there's no session yet.
  if (!data.session) {
    return { message: `Check ${email} for a confirmation link, then log in.` };
  }
  redirect(safeNext(formData.get("next")));
}

/** Re-send the confirmation email for an unconfirmed account. */
export async function resendConfirmation(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email first" };

  const supabase = await supabaseServer();
  const origin = await appOrigin();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return { error: error.message };
  return { message: `Sent a new confirmation link to ${email}.` };
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid email" };

  const supabase = await supabaseServer();
  const origin = await appOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?type=recovery`,
  });
  // Don't leak whether an address has an account — report success either way.
  if (error && !/not found|no user/i.test(error.message)) {
    return { error: error.message };
  }
  return {
    message: `If ${email} has an account, a reset link is on its way.`,
  };
}

export async function updatePassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters" };
  if (password !== confirm) return { error: "Those passwords don't match" };

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your reset link has expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}
