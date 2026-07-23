/**
 * Emits the corpus seed as idempotent SQL (delete-and-reinsert of anchor/seed
 * rows only; user corpus rows are never touched). Used once at setup and kept
 * for reproducibility.
 */
import { SEED_CORPUS } from "../seed/corpus";

const esc = (s: string) => s.replace(/'/g, "''");

const rows = SEED_CORPUS.map((e) => {
  const elo = 1000 + e.score * 10;
  const locked = e.source === "anchor";
  const matchCount = e.source === "anchor" ? 999 : 6;
  return `('${esc(e.content)}', '${e.source}', ${locked}, ${elo}, ${matchCount}, ${e.prose}, '${esc(e.label)}')`;
});

console.log(`delete from public.corpus_essays where source in ('anchor','seed');
insert into public.corpus_essays (content, source, locked, elo, match_count, prose_score, label) values
${rows.join(",\n")};`);
