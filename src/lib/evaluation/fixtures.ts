import type { DimensionKey, EvaluationEvent, EvaluationResult } from "./types";

/**
 * Development fixture transport data.
 *
 * These are the only place in the codebase allowed to fabricate live
 * evaluation snapshots. They are wired up exclusively through
 * `FixtureTransport` (see transport.ts), which a server component gates
 * behind `process.env.NODE_ENV !== "production"` — never reachable in a
 * production build regardless of client input.
 *
 * Evidence strings are never hardcoded: they are extracted verbatim from
 * whatever essay the fixture is running against, so "every evidence quote
 * is an exact substring of the essay" holds for any input, not just one
 * canned sample.
 */

function splitSentences(essay: string): string[] {
  const out: string[] = [];
  const re = /[^.!?]+[.!?]+(?=\s|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(essay))) {
    const s = m[0].trim();
    if (s.length >= 25 && s.length <= 220) out.push(s);
  }
  return out;
}

/** Pick `count` distinct, exact-substring excerpts spread across the essay. */
export function extractExcerpts(essay: string, count: number): string[] {
  const sentences = splitSentences(essay);
  if (sentences.length === 0) return Array(count).fill(essay.slice(0, 80).trim());
  const picks: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.min(sentences.length - 1, Math.round((i / Math.max(1, count - 1)) * (sentences.length - 1)));
    picks.push(sentences[idx]);
  }
  return picks;
}

/** Timing between fixture events, in ms. A reduced-motion variant collapses
 *  these near-zero so the same script can be replayed instantly for testing
 *  or for users with `prefers-reduced-motion`. */
export function fixtureTiming(reducedMotion: boolean): number[] {
  const full = [400, 900, 1400, 1200, 1600, 1300, 1500, 1400, 1300, 1200, 1100, 1000, 900];
  return reducedMotion ? full.map(() => 60) : full;
}

function buildResult(evaluationId: string, excerpts: string[]): EvaluationResult {
  const dimensions: Record<DimensionKey, number> = {
    distinctiveness: 62,
    specificity: 65,
    reflection: 44,
    voice: 76,
    structure: 58,
    memorability: 61,
    prose_control: 70,
  };

  return {
    evaluationId,
    score: 60.2,
    scoreInterval: { low: 57, high: 63 },
    tier: "Distinctive",
    distanceToNextTier: 5,
    dimensions,
    strongestSignal: "voice",
    focusArea: "reflection",
    confirmedInsights: [
      {
        id: "insight-voice",
        category: "voice",
        status: "confirmed",
        title: "Voice reads as controlled and personal",
        text: "The narration holds a consistent, self-aware tone without reaching for effect.",
        evidence: excerpts[0],
      },
      {
        id: "insight-specificity",
        category: "specificity",
        status: "confirmed",
        title: "Concrete detail carries the essay",
        text: "Specific, lived-in details make the writing feel grounded rather than generic.",
        evidence: excerpts[1],
      },
      {
        id: "insight-reflection",
        category: "reflection",
        status: "confirmed",
        title: "Reflection names the realization but stops short of it",
        text: "The insight is clear, but its effect on later choices stays largely unstated.",
        evidence: excerpts[2],
      },
    ],
    readerSnapshot: {
      currentImpression: "A capable, self-aware writer who notices detail most applicants would skip past.",
      memorableElement: excerpts[0],
      missingDimension:
        "How the realization in the essay actually changed a later decision or habit.",
    },
    dimensionDetails: [
      {
        key: "voice",
        score: 76,
        status: "Strength",
        interpretation: "Your voice consistently feels controlled, self-aware, and personal.",
        evidenceCount: 4,
        whatReadersSaw: "Readers consistently noted a steady, unforced narrating presence.",
        excerpt: excerpts[0],
        whyItMatters: "A consistent voice is what makes a reader trust the rest of the essay.",
        revisionQuestion: "Where in the draft does the voice waver toward a more generic register?",
        confidenceLanguage: "This held across every reading.",
      },
      {
        key: "specificity",
        score: 65,
        status: "Developing strength",
        interpretation: "Concrete, sensory detail regularly makes the writing feel lived-in.",
        evidenceCount: 3,
        whatReadersSaw: "Specific nouns and small physical details recurred as the strongest moments.",
        excerpt: excerpts[1],
        whyItMatters: "Specific detail is what makes an experience feel unrepeatable by anyone else.",
        revisionQuestion: "Which paragraph relies most on general statement instead of a concrete image?",
        confidenceLanguage: "Consistent across most of the essay.",
      },
      {
        key: "distinctiveness",
        score: 62,
        status: "Developing strength",
        interpretation: "The subject and framing stand out from common essay patterns, unevenly.",
        evidenceCount: 3,
        whatReadersSaw: "The opening and closing felt distinct; the middle leaned more familiar.",
        excerpt: excerpts[3 % excerpts.length],
        whyItMatters: "Distinctiveness is what keeps a reader from mentally filing the essay as familiar.",
        revisionQuestion: "What is true of this experience that would not be true of most applicants'?",
        confidenceLanguage: "Moderate agreement across readings.",
      },
      {
        key: "memorability",
        score: 61,
        status: "Developing strength",
        interpretation: "One image is likely to stay with a reader after they move on.",
        evidenceCount: 2,
        whatReadersSaw: "A single concrete moment recurred as the thing readers cited afterward.",
        excerpt: excerpts[0],
        whyItMatters: "One memorable image often does more work than several competent paragraphs.",
        revisionQuestion: "If a reader could only remember one line, is it the one you'd choose?",
        confidenceLanguage: "Consistent, but narrow — tied to a single passage.",
      },
      {
        key: "structure",
        score: 58,
        status: "Uneven",
        interpretation: "The essay's shape mostly supports the material but loosens in the middle.",
        evidenceCount: 3,
        whatReadersSaw: "The opening and ending were well anchored; pacing sagged in the middle third.",
        excerpt: excerpts[2],
        whyItMatters: "Structure is what lets a reader feel the essay is going somewhere on purpose.",
        revisionQuestion: "What could the middle section lose without losing any meaning?",
        confidenceLanguage: "Consistent across readings.",
      },
      {
        key: "prose_control",
        score: 70,
        status: "Strength",
        interpretation: "Sentences are controlled and rarely call attention to themselves.",
        evidenceCount: 3,
        whatReadersSaw: "Clean, varied sentence rhythm throughout, with few clichés.",
        excerpt: excerpts[1],
        whyItMatters: "Prose that doesn't get in the way lets the substance of the essay carry it.",
        revisionQuestion: "Is there a sentence you're proud of that's doing more showing off than working?",
        confidenceLanguage: "Consistent across every reading.",
      },
      {
        key: "reflection",
        score: 44,
        status: "Opportunity",
        interpretation:
          "The essay communicates what happened more clearly than how the experience changed your later behavior.",
        evidenceCount: 3,
        whatReadersSaw: "Readers found the realization clear but its downstream effect largely unstated.",
        excerpt: excerpts[2],
        whyItMatters: "Reflection is what tells a reader this experience actually changed you.",
        revisionQuestion: "What do you now do, notice, or believe differently because of this experience?",
        confidenceLanguage: "Consistent across every reading — this is a stable pattern, not noise.",
      },
    ],
    strengths: [
      {
        category: "voice",
        title: "A controlled, personal voice",
        explanation: "Your voice consistently feels controlled, self-aware, and personal — it reads like one person, not an assembled essay.",
        excerpt: excerpts[0],
        whyItMatters: "Consistent voice is what earns a reader's trust in everything that follows.",
        protectNote: "Protect this in revision — don't let editing smooth it into something more generic.",
      },
      {
        category: "specificity",
        title: "Concrete, lived-in detail",
        explanation: "Specific details consistently make the experience feel real rather than summarized.",
        excerpt: excerpts[1],
        whyItMatters: "Concrete detail is what makes this experience feel like it could only be yours.",
        protectNote: "Protect this in revision — resist the urge to generalize it for space.",
      },
    ],
    revisionPriorities: [
      {
        rank: 1,
        category: "reflection",
        diagnosis:
          "The essay clearly names the realization, but it does not yet show how that realization affected a later choice or behavior.",
        excerpt: excerpts[2],
        whyItMatters: "Without a visible after, the reflection reads as a stated conclusion rather than an earned change.",
        direction: "Add one concrete, later moment where the realization visibly changed what you did.",
        question: "What do you now do, notice, or believe differently because of this experience?",
        successTest: 'A reader should be able to finish the sentence: "This experience changed the writer by…"',
      },
      {
        rank: 2,
        category: "structure",
        diagnosis: "The middle section loses momentum, restating material the opening already established.",
        excerpt: excerpts[2],
        whyItMatters: "A sagging middle makes even strong material feel longer than it needs to.",
        direction: "Compress the middle by roughly two sentences and cut restated context.",
        question: "What could this section lose without losing any meaning?",
        successTest: "A reader should feel forward motion in every paragraph, not just the first and last.",
      },
      {
        rank: 3,
        category: "distinctiveness",
        diagnosis: "A few passages lean on framing common to this essay topic rather than what makes your version specific.",
        excerpt: excerpts[3 % excerpts.length],
        whyItMatters: "Familiar framing is the fastest way for a strong essay to become forgettable.",
        direction: "Replace general statements with the one detail only you would know to include.",
        question: "What is true of this moment that wouldn't be true of most people's version of it?",
        successTest: "A reader should be able to name one detail they haven't read in a similar essay before.",
      },
    ],
    nextDraftPlan: [
      "Add one later action that demonstrates the internal change.",
      "Compress the middle section by roughly two sentences.",
      "Preserve the opening and its most specific line.",
      "Read the final paragraph aloud and remove repeated conclusions.",
      "Submit the next draft for a revision check.",
    ],
    completedAt: new Date().toISOString(),
    mock: true,
  };
}

/** The primary demonstration script: an early score climbing, one honest
 *  downward correction, a narrowing interval, voice emerging as the
 *  strongest signal, and reflection as the focus area. */
export function buildFixtureEvents(essay: string, evaluationId: string): EvaluationEvent[] {
  const excerpts = extractExcerpts(essay, 5);
  const result = buildResult(evaluationId, excerpts);
  let seq = 0;
  const next = () => ++seq;

  const events: EvaluationEvent[] = [
    { type: "analysis.started", sequence: next(), evaluation_id: evaluationId },
    {
      type: "analysis.update",
      sequence: next(),
      evaluation_id: evaluationId,
      progress: 8,
      phase: "reading",
      provisional_score: null,
      score_interval: null,
      tier: null,
      distance_to_next_tier: null,
      confidence: "early",
      dimensions: null,
      strongest_signal: null,
      focus_area: null,
    },
    {
      type: "analysis.update",
      sequence: next(),
      evaluation_id: evaluationId,
      progress: 22,
      phase: "locating",
      provisional_score: 46,
      score_interval: { low: 32, high: 73 },
      tier: null,
      distance_to_next_tier: null,
      confidence: "early",
      dimensions: { voice: 58 },
      strongest_signal: null,
      focus_area: null,
    },
    {
      type: "insight.update",
      sequence: next(),
      evaluation_id: evaluationId,
      insight: {
        id: "insight-voice",
        category: "voice",
        status: "emerging",
        title: "Voice is emerging as a strength",
        text: "The opening feels controlled and personal without trying to impress.",
        evidence: excerpts[0],
      },
    },
    {
      type: "analysis.update",
      sequence: next(),
      evaluation_id: evaluationId,
      progress: 40,
      phase: "mapping",
      provisional_score: 53,
      score_interval: { low: 41, high: 68 },
      tier: "Distinctive",
      distance_to_next_tier: 12,
      confidence: "building",
      dimensions: { voice: 68, specificity: 60, distinctiveness: 55 },
      strongest_signal: "voice",
      focus_area: null,
    },
    {
      type: "insight.update",
      sequence: next(),
      evaluation_id: evaluationId,
      insight: {
        id: "insight-specificity",
        category: "specificity",
        status: "emerging",
        title: "Specific details are consistently helping",
        text: "Concrete details make the experience feel lived-in.",
        evidence: excerpts[1],
      },
    },
    {
      type: "analysis.update",
      sequence: next(),
      evaluation_id: evaluationId,
      progress: 52,
      phase: "mapping",
      provisional_score: 50,
      score_interval: { low: 41, high: 65 },
      tier: "Distinctive",
      distance_to_next_tier: 15,
      confidence: "building",
      dimensions: { reflection: 40, structure: 54 },
      strongest_signal: "voice",
      focus_area: "reflection",
    },
    {
      type: "insight.update",
      sequence: next(),
      evaluation_id: evaluationId,
      insight: {
        id: "insight-reflection",
        category: "reflection",
        status: "emerging",
        title: "Reflection is showing mixed results",
        text: "The realization is clear, but its later consequences remain less developed.",
        evidence: excerpts[2],
      },
    },
    {
      type: "analysis.update",
      sequence: next(),
      evaluation_id: evaluationId,
      progress: 65,
      phase: "mapping",
      provisional_score: 57,
      score_interval: { low: 45, high: 64 },
      tier: "Distinctive",
      distance_to_next_tier: 8,
      confidence: "building",
      dimensions: { memorability: 59, prose_control: 68 },
      strongest_signal: "voice",
      focus_area: "reflection",
    },
    {
      type: "analysis.update",
      sequence: next(),
      evaluation_id: evaluationId,
      progress: 78,
      phase: "verifying",
      provisional_score: 61,
      score_interval: { low: 49, high: 65 },
      tier: "Distinctive",
      distance_to_next_tier: 4,
      confidence: "building",
      dimensions: { voice: 74, distinctiveness: 60 },
      strongest_signal: "voice",
      focus_area: "reflection",
    },
    {
      type: "analysis.update",
      sequence: next(),
      evaluation_id: evaluationId,
      progress: 87,
      phase: "verifying",
      provisional_score: 59,
      score_interval: { low: 54, high: 63 },
      tier: "Distinctive",
      distance_to_next_tier: 5,
      confidence: "stable",
      dimensions: result.dimensions,
      strongest_signal: "voice",
      focus_area: "reflection",
    },
    { type: "feedback.started", sequence: next(), evaluation_id: evaluationId, progress: 95 },
    { type: "evaluation.completed", sequence: next(), evaluation_id: evaluationId, result },
  ];

  return events;
}

/** Scoring itself fails early — nothing to preserve. */
export function buildFailedFixtureEvents(evaluationId: string): EvaluationEvent[] {
  return [
    { type: "analysis.started", sequence: 1, evaluation_id: evaluationId },
    {
      type: "analysis.update",
      sequence: 2,
      evaluation_id: evaluationId,
      progress: 12,
      phase: "reading",
      provisional_score: null,
      score_interval: null,
      tier: null,
      distance_to_next_tier: null,
      confidence: "early",
      dimensions: null,
      strongest_signal: null,
      focus_area: null,
    },
    {
      type: "evaluation.failed",
      sequence: 3,
      evaluation_id: evaluationId,
      stage: "scoring",
      message:
        "We saved your essay, but the analysis did not finish. You can safely try again.",
      partialResult: null,
    },
  ];
}

/** Scoring succeeds; feedback generation fails afterward. Score must survive. */
export function buildFeedbackFailureFixtureEvents(
  essay: string,
  evaluationId: string
): EvaluationEvent[] {
  const scored = buildFixtureEvents(essay, evaluationId).filter(
    (e) => e.type !== "evaluation.completed"
  );
  const last = scored[scored.length - 1];
  const partial =
    last.type === "analysis.update"
      ? {
          score: last.provisional_score ?? 58,
          scoreInterval: last.score_interval ?? { low: 50, high: 66 },
          tier: last.tier ?? "Distinctive",
          distanceToNextTier: last.distance_to_next_tier ?? 6,
          dimensions: {
            distinctiveness: 60,
            specificity: 63,
            reflection: 42,
            voice: 74,
            structure: 56,
            memorability: 58,
            prose_control: 68,
          },
          strongestSignal: "voice" as const,
          focusArea: "reflection" as const,
        }
      : null;

  return [
    ...scored,
    { type: "feedback.started", sequence: scored.length + 1, evaluation_id: evaluationId, progress: 94 },
    {
      type: "evaluation.failed",
      sequence: scored.length + 2,
      evaluation_id: evaluationId,
      stage: "feedback",
      message:
        "Your score is in, but the written feedback did not finish generating. You can safely try again — your score is safe either way.",
      partialResult: partial,
    },
  ];
}
