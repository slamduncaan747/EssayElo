import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/essays", "/upgrade", "/account"];
const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));

  // Without Supabase credentials we cannot establish a session. Fail closed on
  // protected routes, but let public pages (landing, pricing, auth) still
  // render — a misconfigured env var shouldn't 500 the marketing site.
  if (!url || !anonKey) {
    if (isProtected) return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh the session (required for SSR) and gate protected routes.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /**
   * Carry any cookies Supabase just wrote onto a redirect.
   *
   * `getUser()` rotates the refresh token when the access token is stale. Those
   * new tokens land on `response` via `setAll` above — so returning a *fresh*
   * `NextResponse.redirect()` silently discards them while the old refresh
   * token has already been consumed server-side. The next request then arrives
   * unauthenticated, which reads to the user as "login doesn't work" or an
   * endless bounce between /login and /dashboard.
   */
  function redirectTo(pathname: string, search?: URLSearchParams): NextResponse {
    const target = request.nextUrl.clone();
    target.pathname = pathname;
    target.search = search ? `?${search}` : "";
    const redirect = NextResponse.redirect(target);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  if (!user && isProtected) {
    const params = new URLSearchParams({ next: path + request.nextUrl.search });
    return redirectTo("/login", params);
  }
  if (user && AUTH_PAGES.includes(path)) {
    return redirectTo("/dashboard");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
