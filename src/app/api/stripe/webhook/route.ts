import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Stripe webhook. Signature-verified against the raw body; unauthenticated
 * by design (excluded from auth middleware). Plan changes happen only here
 * and are keyed to the Stripe customer id stored at checkout time.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    const raw = await req.text();
    event = await stripe().webhooks.constructEventAsync(raw, signature, secret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const db = supabaseAdmin();

  async function setPlanByCustomer(
    customerId: string,
    plan: "free" | "plus",
    subscriptionId: string | null
  ) {
    await db
      .from("profiles")
      .update({ plan, stripe_subscription_id: subscriptionId })
      .eq("stripe_customer_id", customerId);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription" && session.customer) {
        await setPlanByCustomer(
          session.customer as string,
          "plus",
          (session.subscription as string) ?? null
        );
      }
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object;
      const active = sub.status === "active" || sub.status === "trialing";
      await setPlanByCustomer(
        sub.customer as string,
        active ? "plus" : "free",
        active ? sub.id : null
      );
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await setPlanByCustomer(sub.customer as string, "free", null);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
