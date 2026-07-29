# Archived evaluation engine

This is the original Elo-tournament essay-scoring engine (LLM judge, matchmaker,
reliability/cluster analysis, prompts, Anthropic client) plus the scripts and
corpus data that supported it. It's frozen here for reference while the real
scoring logic is rewritten from scratch as a separate Python API.

Nothing in this directory is built, imported, or typechecked by the Next.js
app (`tsconfig.json` excludes it). `src/lib/evaluate.ts` is the current stub
that stands in for all of this — it always returns a score of 5.

Paths mirror where each file used to live under `src/`:
- `src/lib/engine/*` (elo, judge, matchmaker, tournament, cluster, reliability, assemble, prompts, config, preset, mock)
- `src/lib/anthropic.ts`, `src/lib/anthropic-provider.ts`
- `src/lib/analysis.ts`
- `seed/corpus.ts`
- `scripts/{seed-db,seed-sql,test-engine}.ts`

`src/lib/engine/scale.ts` (elo↔score conversion) was **not** archived — it's
pure display math with no judgment logic, and both the stub and the UI still
depend on it.
