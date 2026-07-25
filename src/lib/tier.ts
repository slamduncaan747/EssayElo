/**
 * Score tiers — the human-readable rank a 0–100 score falls into.
 *
 * The scale is deliberately stringent (45 = a genuinely well-written but
 * unremarkable essay), so the tier names describe *what the essay does to a
 * reader*, not a grade. Colors are shared by every surface that shows a score.
 */

export interface Tier {
  key: "standout" | "compelling" | "distinctive" | "polished" | "developing" | "raw";
  /** Rank name shown next to the score. */
  name: string;
  /** Lowest score in the tier. */
  min: number;
  /** Solid color — dots, bars, rings. */
  color: string;
  /** Tinted background for the badge. */
  soft: string;
  /** Readable text color on `soft`. */
  ink: string;
  /** One line on what the tier means. */
  blurb: string;
}

export const TIERS: Tier[] = [
  {
    key: "standout",
    name: "Standout",
    min: 80,
    color: "var(--gold)",
    soft: "var(--gold-soft)",
    ink: "var(--gold-ink)",
    blurb: "Moves the application on its own. 0.4% of essays.",
  },
  {
    key: "compelling",
    name: "Compelling",
    min: 65,
    color: "var(--gold-press)",
    soft: "var(--gold-soft)",
    ink: "var(--gold-ink)",
    blurb: "Begins to help — the reader remembers a detail.",
  },
  {
    key: "distinctive",
    name: "Distinctive",
    min: 50,
    color: "var(--brand)",
    soft: "var(--brand-soft)",
    ink: "var(--brand-ink)",
    blurb: "A person is visible, unevenly. Real upside left.",
  },
  {
    key: "polished",
    name: "Polished",
    min: 34,
    color: "var(--brand-press)",
    soft: "var(--brand-soft)",
    ink: "var(--brand-ink)",
    blurb: "Well written and sincere. Where most essays land.",
  },
  {
    key: "developing",
    name: "Developing",
    min: 18,
    color: "var(--muted)",
    soft: "var(--cream-2)",
    ink: "var(--body)",
    blurb: "Competent, clean, forgettable.",
  },
  {
    key: "raw",
    name: "Needs work",
    min: 0,
    color: "var(--red)",
    soft: "var(--red-soft)",
    ink: "var(--red-ink)",
    blurb: "Actively hurts the application. Rare.",
  },
];

/** The tier a 0–100 score falls into. */
export function tierForScore(score: number): Tier {
  return TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1];
}

/** Tier for a band, judged by its midpoint. */
export function tierForBand(low: number, high: number): Tier {
  return tierForScore((low + high) / 2);
}

/** The top of a tier — used to draw progress toward the next rank. */
export function tierCeiling(tier: Tier): number {
  const i = TIERS.findIndex((t) => t.key === tier.key);
  return i <= 0 ? 100 : TIERS[i - 1].min;
}

/** Progress through the current tier, 0–1. */
export function tierProgress(score: number): number {
  const t = tierForScore(score);
  const ceil = tierCeiling(t);
  if (ceil <= t.min) return 1;
  return Math.min(1, Math.max(0, (score - t.min) / (ceil - t.min)));
}
