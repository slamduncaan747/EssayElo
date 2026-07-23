/**
 * One-time Stripe setup: creates the "Margin Plus" product and $12/mo price
 * (idempotent — reuses them if they already exist) and prints STRIPE_PRICE_ID.
 *
 *   STRIPE_SECRET_KEY=sk_... npx tsx scripts/setup-stripe.ts
 */
import Stripe from "stripe";

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("Set STRIPE_SECRET_KEY");
    process.exit(1);
  }
  const stripe = new Stripe(key);

  const products = await stripe.products.search({
    query: `name:'Margin Plus' AND active:'true'`,
  });
  const product =
    products.data[0] ??
    (await stripe.products.create({
      name: "Margin Plus",
      description:
        "Exact scores to the tenth, every line reviewed, prose vs structure split, prioritized fixes, 15 evaluations a month.",
    }));

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
  const price =
    prices.data.find(
      (p) => p.recurring?.interval === "month" && p.unit_amount === 1200 && p.currency === "usd"
    ) ??
    (await stripe.prices.create({
      product: product.id,
      unit_amount: 1200,
      currency: "usd",
      recurring: { interval: "month" },
      nickname: "Plus monthly",
    }));

  console.log(`Product: ${product.id}`);
  console.log(`STRIPE_PRICE_ID=${price.id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
