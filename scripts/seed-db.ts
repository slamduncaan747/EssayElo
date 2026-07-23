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

  const del = await db.from("corpus_essays").delete().in("source", ["anchor", "seed"]);
  if (del.error) throw new Error(del.error.message);

  const rows = SEED_CORPUS.map((e) => ({
    content: e.content,
    source: e.source,
    locked: e.source === "anchor",
    elo: 1000 + e.score * 10,
    match_count: e.source === "anchor" ? 999 : 6,
    prose_score: e.prose,
    label: e.label,
  }));
  const ins = await db.from("corpus_essays").insert(rows);
  if (ins.error) throw new Error(ins.error.message);

  console.log(`Seeded ${rows.length} corpus essays (${rows.filter((r) => r.locked).length} locked anchors).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
