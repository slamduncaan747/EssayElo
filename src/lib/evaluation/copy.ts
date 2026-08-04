import type { Confidence, DimensionKey, EvaluationStatus } from "./types";

/**
 * All user-facing strings for the live evaluation experience in one place,
 * so tone stays consistent and nothing slips into gamified or clinical
 * language. See the product spec: calm, intelligent, direct, encouraging
 * without being falsely positive.
 */

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  distinctiveness: "Distinctiveness",
  specificity: "Specificity",
  reflection: "Reflection",
  voice: "Voice",
  structure: "Structure",
  memorability: "Memorability",
  prose_control: "Prose control",
};

/** Real words that fit a radar axis. Never truncate the full labels with an
 *  ellipsis — "Distinctiv…" reads as a rendering bug, not a design choice. */
export const DIMENSION_SHORT_LABELS: Record<DimensionKey, string> = {
  distinctiveness: "Distinct",
  specificity: "Specific",
  reflection: "Reflection",
  voice: "Voice",
  structure: "Structure",
  memorability: "Memorable",
  prose_control: "Prose",
};

export const PHASE_COPY: Record<
  EvaluationStatus,
  { headline: string; secondary: string; progressFloor: number; progressCeil: number }
> = {
  idle: { headline: "", secondary: "", progressFloor: 0, progressCeil: 0 },
  submitting: {
    headline: "Sending your draft",
    secondary: "Handing your essay to Margin.",
    progressFloor: 0,
    progressCeil: 2,
  },
  reading: {
    headline: "Reading your draft",
    secondary: "Getting a sense of your voice, subject, and structure.",
    progressFloor: 0,
    progressCeil: 15,
  },
  locating: {
    headline: "Locating your range",
    secondary: "Placing your essay within the reference field.",
    progressFloor: 15,
    progressCeil: 35,
  },
  mapping: {
    headline: "Mapping your essay profile",
    secondary: "Identifying the qualities that hold up most consistently.",
    progressFloor: 35,
    progressCeil: 70,
  },
  verifying: {
    headline: "Verifying reader signals",
    secondary: "Checking that the emerging patterns are consistent.",
    progressFloor: 70,
    progressCeil: 90,
  },
  synthesizing: {
    headline: "Building your revision plan",
    secondary: "Turning the analysis into clear next steps.",
    progressFloor: 90,
    progressCeil: 99,
  },
  complete: {
    headline: "Analysis complete",
    secondary: "Margin has a settled read on your draft.",
    progressFloor: 100,
    progressCeil: 100,
  },
  failed: {
    headline: "We hit a snag",
    secondary: "We saved your essay, but the analysis did not finish.",
    progressFloor: 0,
    progressCeil: 0,
  },
};

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  early: "Early",
  building: "Building",
  stable: "Stable",
};

export const STILL_EMERGING = "Still emerging";

export const ERROR_COPY = {
  scoring:
    "We saved your essay, but the analysis did not finish. You can safely try again.",
  feedback:
    "Your score is in, but the written feedback did not finish generating. You can safely try again — your score is safe either way.",
};

/** Qualitative language for a live (not-yet-final) dimension reading. */
export function liveDimensionStatus(value: number): string {
  if (value >= 66) return "Emerging strength";
  if (value >= 45) return "Stabilizing";
  return "Mixed";
}

/** Qualitative language for a final, whole-number dimension score. */
export function finalDimensionStatus(value: number): string {
  if (value >= 70) return "Strength";
  if (value >= 50) return "Developing strength";
  if (value >= 35) return "Uneven";
  return "Opportunity";
}
