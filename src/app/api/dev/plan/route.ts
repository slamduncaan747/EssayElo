import { NextResponse } from "next/server";
import { handleApiError, requireUser } from "@/lib/api";
import { ApiError } from "@/lib/validate";

export const runtime = "nodejs";

/**
 * TESTING ONLY — flip the caller's own plan without going through Stripe.
 *
 * Gated behind ALLOW_PLAN_TOGGLE=1 so it cannot be reached on a real
 * deployment: without that env var this route 404s. Remove the env var (or
 * this file) before charging real customers — otherwise anyone with an
 * account can grant themselves Plus.
 */
export async function POST(req: Request) {
  try {
    if (process.env.ALLOW_PLAN_TOGGLE !== "1") {
      throw new ApiError(404, "Not found");
    }
    const ctx = await requireUser();
    const body = await req.json().catch(() => ({}));
    const plan = body.plan === "plus" ? "plus" : "free";

    // Never touch a real subscriber's billing state with the test toggle.
    if (ctx.profile.stripe_subscription_id) {
      throw new ApiError(400, "Manage your plan through billing, not the toggle");
    }

    const { error } = await ctx.db
      .from("profiles")
      .update({ plan })
      .eq("id", ctx.user.id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ plan });
  } catch (e) {
    return handleApiError(e);
  }
}
