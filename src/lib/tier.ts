/**
 * Score ranks — the name a 0–100 score carries.
 *
 * The scale is deliberately stringent (45 = a genuinely well-written but
 * unremarkable essay), so ranks describe what the essay does to a reader
 * rather than grading it. Every surface that shows a score reads its colour
 * from here, so a number looks the same everywhere it appears.
 */

export interface Tier {
  key: "standout" | "compelling" | "distinctive" | "polished" | "developing" | "raw";
  /** Rank name shown beside the score. */
  name: string;
  /** Lowest score in the rank. */
  min: number;
  /** Solid colour — dots, bars, rings. */
  color: string;
  /** Deeper shade, for medallion gradients and shadows. */
  deep: string;
  /** Tinted background for pills. */
  soft: string;
  /** Readable text colour on `soft`. */
  ink: string;
  /** One line on what the rank means. */
  blurb: string;
}

export const TIERS: Tier[] = [
  {
    key: "standout",
    name: "Standout",
    min: 80,
    color: "var(--gold)",
    deep: "var(--gold-press)",
    soft: "var(--gold-50)",
    ink: "var(--gold-ink)",
    blurb: "Moves the application on its own. 0.4% of essays get here.",
  },
  {
    key: "compelling",
    name: "Compelling",
    min: 65,
    color: "var(--gold-press)",
    deep: "var(--gold-ink)",
    soft: "var(--gold-50)",
    ink: "var(--gold-ink)",
    blurb: "Starts to help — the reader remembers a specific detail.",
  },
  {
    key: "distinctive",
    name: "Distinctive",
    min: 50,
    color: "var(--brand)",
    deep: "var(--brand-press)",
    soft: "var(--brand-50)",
    ink: "var(--brand-ink)",
    blurb: "A person is visible, unevenly. Real upside still on the table.",
  },
  {
    key: "polished",
    name: "Polished",
    min: 34,
    color: "var(--brand-press)",
    deep: "var(--brand-ink)",
    soft: "var(--brand-50)",
    ink: "var(--brand-ink)",
    blurb: "Well written and sincere. Where most strong applicants land.",
  },
  {
    key: "developing",
    name: "Developing",
    min: 18,
    color: "var(--n-500)",
    deep: "var(--n-600)",
    soft: "var(--sunken)",
    ink: "var(--text-2)",
    blurb: "Competent, clean, forgettable.",
  },
  {
    key: "raw",
    name: "Needs work",
    min: 0,
    color: "var(--red)",
    deep: "var(--red-press)",
    soft: "var(--red-50)",
    ink: "var(--red-ink)",
    blurb: "Actively hurts the application. Rare.",
  },
];

/** The rank a 0–100 score falls into. */
export function tierForScore(score: number): Tier {
  return TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1];
}

/** Rank for a band, judged by its midpoint. */
export function tierForBand(low: number, high: number): Tier {
  return tierForScore((low + high) / 2);
}

/** The top of a rank — used to draw progress toward the next one. */
export function tierCeiling(tier: Tier): number {
  const i = TIERS.findIndex((t) => t.key === tier.key);
  return i <= 0 ? 100 : TIERS[i - 1].min;
}

/** The score range a rank covers, formatted for display. */
export function tierRange(tier: Tier): string {
  return tier.key === "standout" ? "80+" : `${tier.min}–${tierCeiling(tier) - 1}`;
}

/** Progress through the current rank, 0–1. */
export function tierProgress(score: number): number {
  const t = tierForScore(score);
  const ceil = tierCeiling(t);
  if (ceil <= t.min) return 1;
  return Math.min(1, Math.max(0, (score - t.min) / (ceil - t.min)));
}

/** Points still needed to reach the next rank, or null at the top. */
export function pointsToNext(score: number): { points: number; next: Tier } | null {
  const t = tierForScore(score);
  const i = TIERS.findIndex((x) => x.key === t.key);
  if (i <= 0) return null;
  const next = TIERS[i - 1];
  return { points: Math.max(0.1, Math.round((next.min - score) * 10) / 10), next };
}
