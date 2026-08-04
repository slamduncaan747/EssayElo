import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Email-confirmation, password-recovery, and OAuth code exchange.
 *
 * Supabase appends `?code=...` to whatever redirect target it was given. We
 * exchange it for a session here and then send the user somewhere useful.
 * A failed exchange (expired or already-used link) is surfaced on the login
 * page rather than silently redirecting to /dashboard, which would just
 * bounce back to /login and read as "login is broken".
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next");

  // Supabase reports link-level problems (expired, already consumed) as query
  // params rather than an exchange failure, so check those first.
  const errorDescription = searchParams.get("error_description");
  if (errorDescription) {
    const url = new URL("/login", origin);
    url.searchParams.set("error", errorDescription);
    return NextResponse.redirect(url);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const url = new URL("/login", origin);
    url.searchParams.set(
      "error",
      "That link has expired or was already used. Request a new one below."
    );
    return NextResponse.redirect(url);
  }

  // A recovery link signs the user in specifically so they can choose a new
  // password — send them to the form rather than the dashboard.
  if (type === "recovery") {
    return NextResponse.redirect(new URL("/reset-password", origin));
  }

  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return NextResponse.redirect(new URL(safeNext, origin));
}
