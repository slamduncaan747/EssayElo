/**
 * Deterministic mock judge (MOCK_JUDGE=1). Lets the entire pipeline — step
 * runner, Elo, reliability, synthesis shape — run end-to-end with zero LLM
 * cost, and powers the engine convergence test (spec build order #1).
 *
 * Latent "true strength" is a cheap producibility proxy: specificity density
 * (digits, proper nouns, concrete sensory words) up, cliché phrases down.
 * It is intentionally crude — it only needs to be *consistent*.
 */

import type { Harvest, Margin } from "@/lib/types";

const CLICHES = [
  "true meaning of",
  "taught me the value of",
  "comfort zone",
  "passion for",
  "make a difference",
  "hard work pays off",
  "learned the importance of",
  "at the end of the day",
  "changed my life",
  "never give up",
  "pushed myself",
  "overcame adversity",
];

export function latentStrength(essay: string): number {
  const text = essay.toLowerCase();
  const words = essay.split(/\s+/).filter(Boolean);
  const n = Math.max(words.length, 1);

  const digits = (essay.match(/\d/g) ?? []).length;
  const proper = words.filter((w, i) => i > 0 && /^[A-Z][a-z]{2,}/.test(w)).length;
  const unique = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z]/g, ""))).size;
  const clicheHits = CLICHES.filter((c) => text.includes(c)).length;

  const specificity = (digits * 2 + proper) / n;
  const lexical = unique / n;

  // Roughly 0–100.
  let s = 30 + specificity * 400 + lexical * 60 - clicheHits * 7;
  return Math.max(2, Math.min(95, s));
}

/** Deterministic per-pair jitter so matches aren't perfectly clean. */
function hashNoise(a: string, b: string): number {
  let h = 2166136261;
  const s = a.slice(0, 80) + "|" + b.slice(0, 80);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000 - 0.5; // [-0.5, 0.5)
}

export function mockPlacement(essay: string): { tier: 2 | 4 | 6; reason: string } {
  const s = latentStrength(essay);
  const tier = s >= 58 ? 6 : s >= 34 ? 4 : 2;
  return { tier, reason: "mock placement" };
}

export function mockCompare(
  essayA: string,
  essayB: string
): {
  winner: "A" | "B";
  margin: Margin;
  harvestFor: (side: "A" | "B", won: boolean) => Harvest;
} {
  const sa = latentStrength(essayA);
  const sb = latentStrength(essayB);
  const noise = hashNoise(essayA, essayB) * 14;
  const diff = sa - sb + noise;
  const winner: "A" | "B" = diff >= 0 ? "A" : "B";
  const ad = Math.abs(diff);
  const margin: Margin = ad > 18 ? "decisive" : ad > 8 ? "clear" : "narrow";
  const harvestFor = (side: "A" | "B", won: boolean): Harvest => ({
    decisive_differentiator: won
      ? "revealed a more specific, less producible person"
      : "the person revealed was familiar — thousands could write this",
    axis: "producibility",
    win_reason: won ? "a specific mind was visible in the details" : null,
    loss_reason: won ? null : "stayed abstract where something specific was available",
    most_producible_revelation: "a lesson-learned frame",
    producibility_estimate: won ? "~2,000" : "~15,000",
    met_person_moment: won ? "the concrete detail mid-essay" : null,
    wasted_opportunity: won ? null : "a mentioned detail left unexplored",
    direction_flag: null,
  });
  return { winner, margin, harvestFor };
}

export function mockProse(essay: string): { prose_score: number; note: string } {
  const words = essay.split(/\s+/).filter(Boolean);
  const avgLen = words.reduce((a, w) => a + w.length, 0) / Math.max(words.length, 1);
  const score = Math.max(20, Math.min(80, 20 + avgLen * 6 + latentStrength(essay) * 0.2));
  return { prose_score: Math.round(score), note: "mock prose measurement" };
}
