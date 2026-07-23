/**
 * Feedback assembler: clusters accumulated match harvest (loss-reasons →
 * weaknesses, win-reasons → strengths, producibility estimates → the "how
 * rare is your material" narrative), then one synthesis call localizes the
 * evidence into the UI's marks / arc / notes format.
 */

import type { EssayMark, Harvest, MatchWinner, SynthesisResult } from "@/lib/types";
import { MOCK_JUDGE, SYNTH_MODEL, structuredCall } from "@/lib/anthropic";
import {
  SYNTHESIS_SCHEMA,
  SYNTHESIS_SYSTEM,
  synthesisUser,
  type SynthesisEvidence,
} from "./prompts";
import { latentStrength } from "./mock";

export interface HarvestedMatch {
  winner: MatchWinner;
  harvest: Harvest | null;
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

export function clusterHarvest(matches: HarvestedMatch[]): {
  wins: string[];
  losses: string[];
  differentiators: string[];
  producibility: string[];
  metPersonMoments: string[];
  wastedOpportunities: string[];
  directionFlags: string[];
  splits: number;
} {
  const hs = matches.map((m) => m.harvest).filter((h): h is Harvest => !!h);
  return {
    wins: dedupe(hs.map((h) => h.win_reason)).slice(0, 8),
    losses: dedupe(hs.map((h) => h.loss_reason)).slice(0, 8),
    differentiators: dedupe(hs.map((h) => h.decisive_differentiator)).slice(0, 8),
    producibility: dedupe(hs.map((h) => h.producibility_estimate)).slice(0, 6),
    metPersonMoments: dedupe(hs.map((h) => h.met_person_moment)).slice(0, 6),
    wastedOpportunities: dedupe(hs.map((h) => h.wasted_opportunity)).slice(0, 6),
    directionFlags: dedupe(hs.map((h) => h.direction_flag)),
    splits: matches.filter((m) => m.winner === "split").length,
  };
}

interface RawSynthesis {
  arc: number[];
  marks: EssayMark[];
  biggest_positive: string;
  biggest_detractor: string;
  structure_score: number;
}

/** Marks must anchor to real text; drop any whose excerpt doesn't match. */
function validateMarks(essay: string, marks: EssayMark[]): EssayMark[] {
  return marks
    .filter((m) => m.excerpt && essay.includes(m.excerpt))
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
  if (MOCK_JUDGE) {
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
      proseScore: opts.proseScore,
      proseNote: opts.proseNote,
      paragraphCount: paras.length,
    };
    raw = await structuredCall<RawSynthesis>({
      model: SYNTH_MODEL,
      system: SYNTHESIS_SYSTEM,
      user: synthesisUser(opts.essay, evidence),
      schema: SYNTHESIS_SCHEMA as unknown as Record<string, unknown>,
      maxTokens: 4000,
      thinking: true,
    });
  }

  const marks = validateMarks(opts.essay, raw.marks);
  // Arc must have exactly one value per paragraph; pad/trim defensively.
  const arc = paras.map((_, i) => Math.round(raw.arc[i] ?? opts.score));

  return {
    arc,
    marks,
    counts: countMarks(marks),
    biggest_positive: raw.biggest_positive,
    biggest_detractor: raw.biggest_detractor,
    structure_score: Math.round(raw.structure_score),
    readers_split: clusters.splits >= 2,
  };
}
