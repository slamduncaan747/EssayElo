# Margin

A chess.com-style analysis engine for college application essays. Paste an essay, get a score out of 100 that actually means something — derived from an adaptive Elo tournament against a calibrated corpus, judged head-to-head by an LLM on one axis: **how producible is the person this essay reveals?**

Built with Next.js 15, Supabase (Postgres + Auth), Stripe subscriptions, and the Anthropic API.

## How the engine works

- **Elo, not absolute scoring.** LLMs compress absolute ratings into 7–8/10; they are far better at "which of these two is stronger." Every score is aggregated from pairwise judgments (`src/lib/engine/elo.ts`, decaying K with a noise floor).
- **Adaptive matchmaking** — spread early to place fast, near-level late for fine discrimination (`matchmaker.ts`).
- **Reliability from convergence, never self-report** (`reliability.ts`):
  - every match runs twice with presentation reversed; a flipped winner is discarded as noise,
  - cross-match intransitivity widens the confidence interval,
  - off-axis reasoning (prose/emotion/topic-weight) is down-weighted.
- **Prose annotates, never adjusts.** Measured on a separate channel, reported as a tag: *prose is carrying it* / *substance ahead of prose*.
- **Honest reporting.** Free tier shows a band (10 matches can't justify a decimal); Plus runs 25 matches and surfaces the exact score plus all harvested evidence.
- **The corpus accretes.** Locked anchor essays calibrate the scale (45 = polished-but-familiar, by design); every evaluated user essay joins the pool.

Run the engine validation (no LLM, no network): `npm run test:engine` — convergence, degrade, and repeat tests per the spec.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in keys (see below)
npm run dev
```

Set `MOCK_JUDGE=1` in `.env.local` to run the entire product with a deterministic mock judge — no Anthropic key or spend needed.

## Setup (one time)

1. **Supabase** — the project `margin` (othgmblwoxeemzltjdfn) already has the schema applied (`supabase/migrations/0001_init.sql`). Seed the corpus either by pasting `supabase/migrations/0002_seed_corpus.sql` into the SQL editor, or:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-db.ts
   ```
   Get the anon + service-role keys from Project Settings → API. Optionally disable "Confirm email" (Auth → Sign In / Up) for friction-free signup while testing.
2. **Stripe** — create the product/price and copy the id:
   ```bash
   STRIPE_SECRET_KEY=sk_... npx tsx scripts/setup-stripe.ts   # prints STRIPE_PRICE_ID
   ```
   Then add a webhook endpoint for `https://<your-domain>/api/stripe/webhook` with events `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and copy the signing secret.
3. **Vercel** — import the repo, add every variable from `.env.example`, deploy. The evaluation step route sets `maxDuration = 300`; enable Fluid Compute (default on new projects).

## Architecture notes

- **Evaluations are a persisted state machine** (`evaluations.phase`), advanced one unit per `POST /api/evaluations/:id/step`. The evaluating screen drives it by polling — serverless-safe, survives tab closes, resumes on revisit. Concurrency is guarded by an atomic row-lock RPC (`claim_evaluation`).
- **Security model:** the browser only talks to Supabase for auth. All data access goes through API routes / server components. RLS is enabled on every table (own-rows read for users; every rating/quota/plan write is service-role only). Stripe webhook is signature-verified; plan changes happen nowhere else. Inputs are validated and rate-limited (monthly eval quotas, daily quick-check cap, one running evaluation per user).
- **Quick checks** run 5 matches from the previous rating — enough to see movement, free and unlimited.
- Corpus essays are never shown to other users; they are only read by the judge. User essays are never used for training.

## Scripts

| Script | Purpose |
|---|---|
| `npm run test:engine` | Elo/matchmaker convergence, degrade & repeat tests (pure code) |
| `npx tsx scripts/seed-db.ts` | Seed/reset the anchor + spread corpus |
| `npx tsx scripts/setup-stripe.ts` | Create the Margin Plus product & price |
| `npx tsx scripts/seed-sql.ts` | Regenerate `0002_seed_corpus.sql` from `seed/corpus.ts` |
