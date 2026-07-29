/**
 * Emits the corpus seed as idempotent, ADDITIVE SQL.
 *
 * Deleting and reinserting is not safe once evaluations exist: `matches` rows
 * hold a foreign key to `corpus_essays`, so a delete either fails or would
 * destroy evaluation history. Instead we insert only labels that aren't
 * present yet — existing rows keep the ratings they've accreted from real
 * matches, which is exactly the behaviour the corpus is supposed to have.
 */
import { SEED_CORPUS } from "../seed/corpus";

const esc = (s: string) => s.replace(/'/g, "''");

const rows = SEED_CORPUS.map((e) => {
  const elo = 1000 + e.score * 10;
  const locked = e.source === "anchor";
  const matchCount = e.source === "anchor" ? 999 : 6;
  return `  ('${esc(e.content)}', '${e.source}', ${locked}, ${elo}, ${matchCount}, ${e.prose}, '${esc(e.label)}')`;
});

console.log(`-- Margin corpus seed (additive, safe to re-run).
-- Adds any missing anchor/seed essays; never touches rows already present,
-- so accreted ratings and referencing match history are preserved.

create unique index if not exists corpus_essays_label_key
  on public.corpus_essays (label);

insert into public.corpus_essays
  (content, source, locked, elo, match_count, prose_score, label)
values
${rows.join(",\n")}
on conflict (label) do nothing;`);
