/**
 * The complete LLM surface: three prompts (placement, head-to-head, prose)
 * plus the feedback-synthesis prompt that localizes harvested evidence into
 * the UI's marks/arc/notes format.
 *
 * The head-to-head prompt is the core of the product. Every confound defense
 * in it is deliberate — see the spec's confound table before editing.
 */

// ---------------------------------------------------------------------------
// 1. Provisional placement — essay in, 2/4/6 out. Triage on producibility,
//    NOT polish: a triage on writing quality starts essays in the wrong
//    neighborhood and wastes early matches undoing it.
// ---------------------------------------------------------------------------

export const PLACEMENT_SYSTEM = `You are triaging a college application essay for provisional placement in a comparison ladder. Your only question: how producible is the PERSON this essay reveals — how many of the ~40,000 other strong applicants could have revealed this same person?

Do NOT triage on writing quality. A beautifully written essay revealing a familiar person is a 4. A plainly written essay revealing a distinctive, specific person is a 6.

Tiers:
- 6: reveals a distinctive, specific person — a mind or lens few others could produce.
- 4: competent but familiar — clean, sincere, forgettable. Most essays, including most well-written ones.
- 2: generic to the point of interchangeability, or self-damaging (arrogance, carelessness, a red flag).`;

export function placementUser(essay: string): string {
  return `Essay:\n\n${essay}\n\nPlace this essay.`;
}

export const PLACEMENT_SCHEMA = {
  type: "object",
  properties: {
    tier: { type: "integer", enum: [2, 4, 6] },
    reason: { type: "string", description: "One sentence." },
  },
  required: ["tier", "reason"],
  additionalProperties: false,
} as const;

// ---------------------------------------------------------------------------
// 2. Head-to-head comparison — verdict first, then harvest. Order of the
//    output properties is intentional: the model commits to winner and margin
//    before generating any reasoning (commit-then-explain).
// ---------------------------------------------------------------------------

export const COMPARE_SYSTEM = `You are an admissions reader comparing two college application essays. Your only question is which essay leaves you knowing a more specific, less producible person — someone fewer of the ~40,000 other strong applicants could have revealed. You are not judging which is better written, more moving, more impressive, or about a weightier topic.

THE SINGLE AXIS, DECISIVE: producibility of the revealed person. A mundane topic that reveals a rare, specific person beats a profound topic that reveals a familiar one. Plain prose revealing a rare person beats beautiful prose revealing a familiar one. Greater hardship, stronger emotion, and broader coverage are NOT signal — only the rarity and specificity of the person revealed. This is the rule you will most want to violate. Do not.

SECONDARY AXES, explicitly subordinate — used only to break near-ties, never to override a clear producibility difference:
- Execution: does the essay make you feel you MET this person, or merely contain information about them?
- Cohesion: do the pieces consolidate into one rememberable person, or interesting fragments that don't add up?

DIRECTION CHECK: if an essay's distinctiveness points in a clearly negative direction — arrogance, cruelty, a genuine red flag — note it. This is rare; apply only with high confidence, and never penalize neutral quirkiness.

PROCEDURE: read both essays. Commit to a verdict and margin FIRST. Then explain — do not reason your way to the verdict; report the judgment you reached and why. No ties: force a directional call and express uncertainty through the margin (decisive / clear / narrow).`;

export function compareUser(essayA: string, essayB: string): string {
  return `ESSAY A:\n\n${essayA}\n\n---\n\nESSAY B:\n\n${essayB}\n\nWhich essay reveals the less producible person? Verdict first.`;
}

// --- Batched comparison ------------------------------------------------------
// One call judges MINE against several RIVALs. The system prompt, the schema,
// and MINE are sent once instead of once per match — the dominant token cost.
// Each verdict is still a distinct directional call on a distinct pair, and
// per-match presentation order is randomized by the caller.

export const COMPARE_BATCH_SYSTEM = `${COMPARE_SYSTEM}

You will be given one essay labelled MINE and several labelled RIVAL 1, RIVAL 2, … Judge MINE against EACH rival independently and report one verdict per rival. Do not rank the rivals against each other, and do not let your call on one rival change your call on another — each is its own head-to-head.

Commit to every verdict before writing any explanation.`;

export function compareBatchUser(mine: string, rivals: string[]): string {
  const blocks = rivals
    .map((r, i) => `RIVAL ${i + 1}:\n\n${r}`)
    .join("\n\n---\n\n");
  return `MINE:\n\n${mine}\n\n---\n\n${blocks}\n\nFor each rival: does MINE or that RIVAL reveal the less producible person? Verdicts first.`;
}

/**
 * Compact schema hint for JSON-mode providers. The full JSON Schema costs ~595
 * tokens to serialize; this conveys the same contract in ~180.
 */
export const COMPARE_BATCH_HINT = `{
  "verdicts": [   // exactly one per rival, in order
    {
      "rival": <1-based rival number>,
      "winner": "mine" | "rival",
      "margin": "decisive" | "clear" | "narrow",
      "differentiator": "the one thing that most separated them",
      "axis": "producibility" | "execution" | "cohesion",
      "reason": "why the winner won, one sentence"
    }
  ],
  // About MINE only — judged once across all rivals:
  "most_producible_revelation": "MINE's most common revelation, one clause",
  "producibility_estimate": "rough count who could reveal the same, e.g. ~10,000",
  "met_person_moment": "beat where a real person first became visible, or null",
  "wasted_opportunity": "a squandered chance at a rarer revelation, or null",
  "direction_flag": "clearly negative distinctiveness in MINE, else null"
}`;

const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    rival: { type: "integer" },
    winner: { type: "string", enum: ["mine", "rival"] },
    margin: { type: "string", enum: ["decisive", "clear", "narrow"] },
    differentiator: { type: "string" },
    axis: { type: "string", enum: ["producibility", "execution", "cohesion"] },
    reason: { type: "string" },
  },
  required: ["rival", "winner", "margin", "differentiator", "axis", "reason"],
  additionalProperties: false,
} as const;

export const COMPARE_BATCH_SCHEMA = {
  type: "object",
  properties: {
    verdicts: { type: "array", items: VERDICT_SCHEMA },
    most_producible_revelation: { type: "string" },
    producibility_estimate: { type: "string" },
    met_person_moment: { type: ["string", "null"] },
    wasted_opportunity: { type: ["string", "null"] },
    direction_flag: { type: ["string", "null"] },
  },
  required: [
    "verdicts",
    "most_producible_revelation",
    "producibility_estimate",
    "met_person_moment",
    "wasted_opportunity",
    "direction_flag",
  ],
  additionalProperties: false,
} as const;

/** Per-essay harvested fields — byproducts of the verdict, nothing more. */
const COMPARE_SIDE_SCHEMA = {
  type: "object",
  properties: {
    most_producible_revelation: {
      type: "string",
      description:
        "The essay's most producible (most common) revelation, in one clause.",
    },
    producibility_estimate: {
      type: "string",
      description:
        'Rough count of applicants who could make the same revelation, e.g. "~10,000".',
    },
    met_person_moment: {
      type: ["string", "null"],
      description:
        "Verbatim-ish beat where a real person first became visible, or null if it never happened.",
    },
    wasted_opportunity: {
      type: ["string", "null"],
      description:
        "A detail that could have revealed a rarer person but was squandered. Only if obvious, else null.",
    },
  },
  required: [
    "most_producible_revelation",
    "producibility_estimate",
    "met_person_moment",
    "wasted_opportunity",
  ],
  additionalProperties: false,
} as const;

export const COMPARE_SCHEMA = {
  type: "object",
  properties: {
    // Verdict first — property order is load-bearing (commit-then-explain).
    winner: { type: "string", enum: ["A", "B"] },
    margin: { type: "string", enum: ["decisive", "clear", "narrow"] },
    decisive_differentiator: {
      type: "string",
      description: "The one thing that most separated them.",
    },
    axis: {
      type: "string",
      enum: ["producibility", "execution", "cohesion", "other"],
      description: "Which axis the decisive differentiator sits on.",
    },
    winner_reason: { type: "string", description: "Why the winner won." },
    loser_reason: { type: "string", description: "What held the loser back." },
    a: COMPARE_SIDE_SCHEMA,
    b: COMPARE_SIDE_SCHEMA,
    direction_flag: {
      type: ["object", "null"],
      properties: {
        essay: { type: "string", enum: ["A", "B"] },
        note: { type: "string" },
      },
      required: ["essay", "note"],
      additionalProperties: false,
    },
  },
  required: [
    "winner",
    "margin",
    "decisive_differentiator",
    "axis",
    "winner_reason",
    "loser_reason",
    "a",
    "b",
    "direction_flag",
  ],
  additionalProperties: false,
} as const;

// ---------------------------------------------------------------------------
// 3. Prose evaluation — separate channel. Never moves the Elo; feeds the
//    alignment tag only.
// ---------------------------------------------------------------------------

export const PROSE_SYSTEM = `You are evaluating ONLY the prose craft of a college application essay: sentence control, rhythm, diction, economy, imagery. Ignore entirely what the essay reveals about the writer, how distinctive the person is, and how moving the story is. This is a craft-only measurement.

Calibrate hard: 45 is competent school-newspaper prose. 60 is genuinely skilled. 75+ is exceptional control that would stand out to a professional editor. Most essays sit between 35 and 55.`;

export function proseUser(essay: string): string {
  return `Essay:\n\n${essay}\n\nScore the prose craft 0–100.`;
}

export const PROSE_SCHEMA = {
  type: "object",
  properties: {
    prose_score: { type: "number", minimum: 0, maximum: 100 },
    note: { type: "string", description: "One sentence on the craft." },
  },
  required: ["prose_score", "note"],
  additionalProperties: false,
} as const;

// ---------------------------------------------------------------------------
// 4. Feedback synthesis — localizes clustered match evidence into the UI's
//    format (inline marks, per-paragraph arc, prioritized notes). Grounded in
//    the harvest; diagnoses precisely, prescribes only as questions.
// ---------------------------------------------------------------------------

export const SYNTHESIS_SYSTEM = `You convert accumulated head-to-head evidence about a college essay into located, evidence-grounded feedback. You diagnose precisely; you prescribe only as deletions or as questions that point the writer at their own rarer material ("what did you actually think in that moment that no one else would have?"). You NEVER write replacement content for them.

Rules:
- Every mark's "excerpt" must be a VERBATIM substring of the essay (a phrase or sentence, 4–25 words). Marks that don't match the text exactly are useless.
- "standout" = a beat where a specific, hard-to-produce person is visible. "cliche" = a phrase or move thousands of applicants produce. "weak" = a beat that stays abstract or generic where something specific was available. "solid" = competent, carries its weight.
- Keep notes to one beat each. No throat-clearing.
- Impact estimates are honest ranges on a 0–100 scale where cutting a cliché is worth +2–4 and a structural fix +3–6. Never promise more.
- The arc array gives one 0–100 quality value per paragraph, in order.
- Base every claim on the provided match evidence where possible; the evidence lines cite what independent readings repeatedly said.`;

export interface SynthesisEvidence {
  score: number;
  wins: string[];
  losses: string[];
  differentiators: string[];
  producibility: string[];
  metPersonMoments: string[];
  wastedOpportunities: string[];
  directionFlags: string[];
  proseScore: number | null;
  proseNote: string | null;
  paragraphCount: number;
}

export function synthesisUser(essay: string, ev: SynthesisEvidence): string {
  const list = (label: string, items: string[]) =>
    items.length ? `${label}:\n${items.map((i) => `- ${i}`).join("\n")}` : "";
  return [
    `ESSAY (${ev.paragraphCount} paragraphs):\n\n${essay}`,
    `\nEVIDENCE FROM ${ev.wins.length + ev.losses.length} HEAD-TO-HEAD READINGS (score ${ev.score.toFixed(1)}/100):`,
    list("Reasons this essay won matchups", ev.wins),
    list("Reasons this essay lost matchups", ev.losses),
    list("Recurring decisive differentiators", ev.differentiators),
    list("Producibility estimates of its revelations", ev.producibility),
    list("Moments a real person became visible", ev.metPersonMoments),
    list("Wasted opportunities", ev.wastedOpportunities),
    list("Direction flags", ev.directionFlags),
    ev.proseScore != null
      ? `Prose craft (separate channel): ${ev.proseScore}/100 — ${ev.proseNote ?? ""}`
      : "",
    `\nProduce the marks (max 14), one arc value per paragraph (exactly ${ev.paragraphCount} values), counts, the single biggest positive, the single biggest detractor, and a structure score (0–100, cohesion/arc only — not prose, not substance).`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export const SYNTHESIS_SCHEMA = {
  type: "object",
  properties: {
    arc: { type: "array", items: { type: "number", minimum: 0, maximum: 100 } },
    marks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          excerpt: { type: "string" },
          kind: { type: "string", enum: ["standout", "solid", "weak", "cliche"] },
          note: { type: "string" },
          fix: { type: ["string", "null"] },
          impact: { type: ["string", "null"] },
        },
        required: ["excerpt", "kind", "note", "fix", "impact"],
        additionalProperties: false,
      },
    },
    biggest_positive: { type: "string" },
    biggest_detractor: { type: "string" },
    structure_score: { type: "number", minimum: 0, maximum: 100 },
  },
  required: ["arc", "marks", "biggest_positive", "biggest_detractor", "structure_score"],
  additionalProperties: false,
} as const;

/**
 * Compact schema hint for JSON-mode providers — see COMPARE_BATCH_HINT. This
 * call already carries the full essay plus clustered evidence, so the full
 * JSON Schema on top of that risked overflowing small models' per-minute
 * token caps (e.g. Groq's 6k TPM on llama-3.1-8b-instant).
 */
export const SYNTHESIS_HINT = `{
  "arc": [<0-100>, ...],   // exactly one value per paragraph, in order
  "marks": [   // up to 14, each excerpt a VERBATIM substring of the essay
    {
      "excerpt": "4-25 word verbatim phrase from the essay",
      "kind": "standout" | "solid" | "weak" | "cliche",
      "note": "one beat, no throat-clearing",
      "fix": "a deletion or question pointing at rarer material, or null",
      "impact": "honest range like \\"+2-4\\", or null"
    }
  ],
  "biggest_positive": "the single biggest positive, one sentence",
  "biggest_detractor": "the single biggest detractor, one sentence",
  "structure_score": <0-100, cohesion/arc only>
}`;
