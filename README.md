# Margin

Paste a college essay, get a score out of 100. Built with Next.js 15,
Supabase (Postgres + Auth), and Stripe subscriptions.

**Scoring is currently a stub.** The real engine — an LLM-judged Elo
tournament against a calibrated corpus — is being rewritten from scratch as
a separate Python API. Until that's wired up, every essay scores a flat 5;
the old engine is preserved in `archive/` for reference. See
`src/lib/evaluate.ts` for the stub and `archive/README.md` for what's there.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Stripe keys
npm run dev
```

No LLM keys are needed to run the app right now — scoring doesn't call out
to anything.

## Setup (one time)

1. **Supabase** (project `kbcinsjhfshbzywmuute`) — apply the schema by
   pasting **`supabase/apply_all.sql`** into the SQL editor, or `apply_migration`
   the files in `supabase/migrations/` in order. Then grab the anon +
   service-role keys from Project Settings → API. Optionally disable
   "Confirm email" (Auth → Sign In / Up) for friction-free signup while
   testing.
2. **Stripe** — create the product/price and copy the id:
   ```bash
   STRIPE_SECRET_KEY=sk_... npx tsx scripts/setup-stripe.ts   # prints STRIPE_PRICE_ID
   ```
   Then add a webhook endpoint for `https://<your-domain>/api/stripe/webhook` with events `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and copy the signing secret.
3. **Vercel** — import the repo, add every variable from `.env.example`, deploy.

## Architecture notes

- **One feature:** paste an essay, get scored immediately (`POST /api/essays`), see the result. No draft editing, no version history — each essay keeps its one evaluation permanently; the dashboard is the eval history.
- **Security model:** the browser only talks to Supabase for auth. All data access goes through API routes / server components. RLS is enabled on every table (own-rows read for users; every plan write is service-role only). Stripe webhook is signature-verified; plan changes happen nowhere else outside the dev-only plan switch. Inputs are validated and rate-limited (monthly eval quotas).
- **Dev plan switch:** a top-right Free/Plus pill (gated behind `ALLOW_PLAN_TOGGLE=1`) flips your own plan without Stripe, so the paywall UI can be exercised locally.

## Scripts

| Script | Purpose |
|---|---|
| `npx tsx scripts/setup-stripe.ts` | Create the Margin Plus product & price |

Archived scripts (`archive/scripts/`) — `seed-db.ts`, `seed-sql.ts`,
`test-engine.ts` — belonged to the old corpus/engine and aren't wired up to
anything right now.
