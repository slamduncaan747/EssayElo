import { NextResponse } from "next/server";
import { handleApiError, requireUser } from "@/lib/api";
import { appUrl, stripe } from "@/lib/stripe";
import { ApiError } from "@/lib/validate";

export const runtime = "nodejs";

/** Billing portal for managing / cancelling the subscription. */
export async function POST() {
  try {
    const ctx = await requireUser();
    if (!ctx.profile.stripe_customer_id)
      throw new ApiError(400, "No billing account yet");
    const session = await stripe().billingPortal.sessions.create({
      customer: ctx.profile.stripe_customer_id,
      return_url: `${appUrl()}/upgrade`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return handleApiError(e);
  }
}
