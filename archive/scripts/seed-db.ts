/**
 * Seeds the corpus (anchors + spread) into Supabase using the service-role
 * key. Idempotent: replaces anchor/seed rows, never touches user rows.
 *
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-db.ts
 */
import { createClient } from "@supabase/supabase-js";
import { SEED_CORPUS } from "../seed/corpus";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const db = createClient(url, key, { auth: { persistSession: false } });

  // Additive: `matches` holds a foreign key to `corpus_essays`, so deleting
  // seeded rows would fail (or destroy evaluation history). Skip labels that
  // already exist — they keep the ratings they've accreted from real matches.
  const { data: existing } = await db.from("corpus_essays").select("label");
  const have = new Set((existing ?? []).map((r) => r.label as string));

  const rows = SEED_CORPUS.filter((e) => !have.has(e.label)).map((e) => ({
    content: e.content,
    source: e.source,
    locked: e.source === "anchor",
    elo: 1000 + e.score * 10,
    match_count: e.source === "anchor" ? 999 : 6,
    prose_score: e.prose,
    label: e.label,
  }));
  if (rows.length > 0) {
    const ins = await db.from("corpus_essays").insert(rows);
    if (ins.error) throw new Error(ins.error.message);
  }

  console.log(
    `Added ${rows.length} corpus essays (${have.size} already present, left untouched).`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
