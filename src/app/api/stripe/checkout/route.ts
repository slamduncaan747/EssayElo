import { NextResponse } from "next/server";
import { handleApiError, requireUser } from "@/lib/api";
import { appUrl, stripe } from "@/lib/stripe";
import { ApiError } from "@/lib/validate";

export const runtime = "nodejs";

/** Create a Stripe Checkout session for the Plus subscription. */
export async function POST() {
  try {
    const ctx = await requireUser();
    if (ctx.plan === "plus") throw new ApiError(400, "Already on Plus");

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) throw new Error("STRIPE_PRICE_ID is not set");

    // Reuse the Stripe customer if one exists; otherwise create it now so the
    // webhook can key plan changes off customer id.
    let customerId = ctx.profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe().customers.create({
        email: ctx.profile.email ?? undefined,
        metadata: { user_id: ctx.user.id },
      });
      customerId = customer.id;
      await ctx.db
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", ctx.user.id);
    }

    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      client_reference_id: ctx.user.id,
      subscription_data: { metadata: { user_id: ctx.user.id } },
      success_url: `${appUrl()}/dashboard?upgraded=1`,
      cancel_url: `${appUrl()}/upgrade`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    return handleApiError(e);
  }
}
