/**
 * Feedback assembler: clusters accumulated match harvest (loss-reasons →
 * weaknesses, win-reasons → strengths, producibility estimates → the "how
 * rare is your material" narrative), then one synthesis call localizes the
 * evidence into the UI's marks / arc / notes format.
 */

import type { EssayMark, Harvest, MatchWinner, SynthesisResult } from "@/lib/types";
import { isMock, synthModel, structuredCall } from "@/lib/anthropic";
import {
  SYNTHESIS_HINT,
  SYNTHESIS_SCHEMA,
  SYNTHESIS_SYSTEM,
  synthesisUser,
  type SynthesisEvidence,
} from "./prompts";
import { clusterThemes, marginWeight, type Theme } from "./cluster";
import { latentStrength } from "./mock";

export interface HarvestedMatch {
  winner: MatchWinner;
  harvest: Harvest | null;
  /** Decisive verdicts carry more diagnostic weight than narrow ones. */
  margin?: string | null;
}

export function paragraphsOf(essay: string): string[] {
  return essay
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function dedupe(items: (string | null)[]): string[] {
  return [...new Set(items.filter((s): s is string => !!s && s.trim().length > 0))];
}

export interface HarvestClusters {
  /** Ranked themes — what readings kept saying, and how many said it. */
  wins: Theme[];
  losses: Theme[];
  differentiators: Theme[];
  producibility: Theme[];
  metPersonMoments: string[];
  wastedOpportunities: string[];
  directionFlags: string[];
  splits: number;
  /** Readings that contributed reasoning, for "N of M" phrasing. */
  totalWins: number;
  totalLosses: number;
  totalReadings: number;
}

/**
 * Turn per-match harvest into ranked themes.
 *
 * Wins and losses are counted against their own totals: "5 of 8 wins" is the
 * honest denominator for a win reason, not "5 of 13 readings".
 */
export function clusterHarvest(matches: HarvestedMatch[]): HarvestClusters {
  const withHarvest = matches.filter(
    (m): m is HarvestedMatch & { harvest: Harvest } => !!m.harvest
  );
  const hs = withHarvest.map((m) => m.harvest);

  const themed = (pick: (h: Harvest) => string | null, only?: MatchWinner) =>
    clusterThemes(
      withHarvest
        .filter((m) => (only ? m.winner === only : true))
        .map((m) => ({ text: pick(m.harvest) ?? "", weight: marginWeight(m.margin) }))
        .filter((t) => t.text.trim().length > 0)
    );

  return {
    wins: themed((h) => h.win_reason, "user").slice(0, 6),
    losses: themed((h) => h.loss_reason, "opponent").slice(0, 6),
    differentiators: themed((h) => h.decisive_differentiator).slice(0, 6),
    producibility: themed((h) => h.producibility_estimate).slice(0, 4),
    metPersonMoments: dedupe(hs.map((h) => h.met_person_moment)).slice(0, 6),
    wastedOpportunities: dedupe(hs.map((h) => h.wasted_opportunity)).slice(0, 6),
    directionFlags: dedupe(hs.map((h) => h.direction_flag)),
    splits: matches.filter((m) => m.winner === "split").length,
    totalWins: withHarvest.filter((m) => m.winner === "user").length,
    totalLosses: withHarvest.filter((m) => m.winner === "opponent").length,
    totalReadings: withHarvest.length,
  };
}

/**
 * Parse an impact range like "+2–4" into a midpoint, so "ordered by estimated
 * impact" can actually order by it. Returns 0 for anything unparseable.
 */
export function impactValue(impact: string | null | undefined): number {
  if (!impact) return 0;
  const nums = impact.match(/\d+(?:\.\d+)?/g);
  if (!nums?.length) return 0;
  const vals = nums.map(Number);
  const mid = vals.reduce((a, b) => a + b, 0) / vals.length;
  return impact.trim().startsWith("-") ? -mid : mid;
}

interface RawSynthesis {
  verdict: string;
  arc: number[];
  marks: EssayMark[];
  biggest_positive: string;
  biggest_detractor: string;
  structure_score: number;
}

/**
 * Marks must anchor to real text; drop any whose excerpt doesn't match, then
 * order by where they appear in the essay so the walkthrough reads top-to-
 * bottom rather than in whatever order the model emitted them.
 */
function validateMarks(essay: string, marks: EssayMark[]): EssayMark[] {
  const seen = new Set<string>();
  return marks
    .filter((m) => {
      if (!m.excerpt || !essay.includes(m.excerpt)) return false;
      if (seen.has(m.excerpt)) return false;
      seen.add(m.excerpt);
      return true;
    })
    .sort((a, b) => essay.indexOf(a.excerpt) - essay.indexOf(b.excerpt))
    .slice(0, 14);
}

function countMarks(marks: EssayMark[]): SynthesisResult["counts"] {
  const counts = { standout: 0, solid: 0, weak: 0, cliche: 0 };
  for (const m of marks) counts[m.kind]++;
  return counts;
}

function mockSynthesis(essay: string, score: number): RawSynthesis {
  const paras = paragraphsOf(essay);
  const arc = paras.map((p) => Math.round(Math.max(10, Math.min(95, latentStrength(p)))));
  const sentences = essay.match(/[^.!?]+[.!?]+/g) ?? [essay];
  const pick = (i: number) => (sentences[i] ?? sentences[0] ?? "").trim();
  const allMarks: EssayMark[] = [
    { excerpt: pick(0), kind: "standout", note: "A specific person is visible here.", fix: null, impact: null },
    { excerpt: pick(Math.floor(sentences.length / 2)), kind: "weak", note: "Stays abstract — what did you actually think here?", fix: "What would only you have noticed in this moment?", impact: "+2–4" },
    { excerpt: pick(sentences.length - 1), kind: "cliche", note: "A phrase readers see every season.", fix: "Delete it. The prior beat already proved the point.", impact: "+2–4" },
  ];
  const marks = allMarks.filter((m) => m.excerpt.length > 0);
  return {
    verdict:
      "This is a competently told story that stays one step back from the person telling it. The scenes are concrete; the conclusions drawn from them are not. The score sits where it does because a reader finishes knowing what happened without knowing who it happened to.",
    arc,
    marks,
    biggest_positive: "Concrete detail carries the strongest beats.",
    biggest_detractor: "The closing generalizes what the scenes already proved.",
    structure_score: Math.round(Math.max(15, Math.min(90, score - 3))),
  };
}

export async function synthesize(opts: {
  essay: string;
  score: number;
  matches: HarvestedMatch[];
  proseScore: number | null;
  proseNote: string | null;
}): Promise<SynthesisResult> {
  const clusters = clusterHarvest(opts.matches);
  const paras = paragraphsOf(opts.essay);

  let raw: RawSynthesis;
  if (isMock()) {
    raw = mockSynthesis(opts.essay, opts.score);
  } else {
    const evidence: SynthesisEvidence = {
      score: opts.score,
      wins: clusters.wins,
      losses: clusters.losses,
      differentiators: clusters.differentiators,
      producibility: clusters.producibility,
      metPersonMoments: clusters.metPersonMoments,
      wastedOpportunities: clusters.wastedOpportunities,
      directionFlags: clusters.directionFlags,
      totalWins: clusters.totalWins,
      totalLosses: clusters.totalLosses,
      totalReadings: clusters.totalReadings,
      proseScore: opts.proseScore,
      proseNote: opts.proseNote,
      paragraphCount: paras.length,
    };
    raw = await structuredCall<RawSynthesis>({
      model: synthModel(),
      system: SYNTHESIS_SYSTEM,
      user: synthesisUser(opts.essay, evidence),
      schema: SYNTHESIS_SCHEMA as unknown as Record<string, unknown>,
      schemaHint: SYNTHESIS_HINT,
      maxTokens: 4000,
      thinking: true,
    });
  }

  const marks = validateMarks(opts.essay, raw.marks);
  // Arc must have exactly one value per paragraph; pad/trim defensively.
  const arc = paras.map((_, i) => Math.round(raw.arc[i] ?? opts.score));

  return {
    verdict: raw.verdict?.trim() || null,
    arc,
    marks,
    counts: countMarks(marks),
    biggest_positive: raw.biggest_positive,
    biggest_detractor: raw.biggest_detractor,
    structure_score: Math.round(raw.structure_score),
    readers_split: clusters.splits >= 2,
  };
}
