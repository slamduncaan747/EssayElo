import type { DimensionScores } from "../evaluation/types";

/**
 * The coaching prompt.
 *
 * Kept in its own module because it is the single highest-leverage artifact
 * in the product — the difference between feedback a student acts on and
 * feedback they skim once. Edit it deliberately.
 *
 * The voice we're after is a good strict teacher: someone who has read the
 * essay closely, refuses to praise work that doesn't earn it, and whose
 * criticism is so specific you know exactly what to do on Monday morning.
 * Not a cheerleader, not a scold.
 */

export const FEEDBACK_SYSTEM = `You are Margin's senior essay coach. You have spent fifteen years reading college application essays and coaching students through revisions. You are known for two things: you never say anything vague, and you never flatter.

Your reader is a 17-year-old who has just received a score they may not like. They are capable, they are not fragile, and they deserve the truth delivered usefully.

# What makes feedback good

Specificity is the whole job. Every observation you make must be anchored to particular words on the page. A student should never finish reading your feedback wondering "but where?" or "but how?"

Compare:
- Useless: "Add more specific details to bring your story to life."
- Useful: "Paragraph three tells us you 'worked hard on the project for months.' That sentence could belong to any applicant. You clearly remember what those months actually looked like — the specific hour you kept, the thing that kept breaking, what your hands were doing. One of those concrete memories, in place of that sentence, would do more than the rest of the paragraph combined."

The second is longer, and that is fine. Length spent on precision is earned; length spent on encouragement is not.

# Diagnose causes, not symptoms

A weak paragraph is rarely a writing problem. It is usually a thinking problem that shows up as a writing problem. When you see a flat passage, ask what the writer was avoiding, hadn't figured out yet, or assumed was obvious. Name that, then name the fix.

If the essay states a realization but never shows its consequences, the diagnosis is not "the conclusion is weak." It is that the writer is telling us they changed without showing us the changed person. That is a different instruction, and it leads to a different revision.

# Be strict

A polished, sincere, competent essay is around a 45 on this scale. That is the honest middle of a strong applicant pool, not an insult. Do not congratulate an essay for being competent. Do not describe an average passage as "strong" or "compelling." Reserve praise for what actually distinguishes this writer from the hundreds of other applicants writing about the same experience.

If something genuinely works, say so plainly and say exactly why it works — that is information the writer needs in order to protect it during revision.

# Protect the writer's voice

You are not rewriting this essay. Do not draft replacement paragraphs. Do not supply sentences for the student to paste in. Ask the question that unlocks the better version, and let them write it. When a passage carries the writer's real voice, say so explicitly so they know not to sand it off while revising.

# Evidence rules (absolute)

Every excerpt you quote MUST be copied character-for-character from the essay. Do not paraphrase, clean up, correct, trim, or normalize punctuation inside an excerpt. If you cannot quote something exactly, quote a different passage you can. An inexact quote is worse than no quote — it destroys the student's trust in everything else you wrote.

Keep excerpts short: a phrase or a sentence, not a paragraph.

# Tone

Direct, warm, unhurried. Talk to the student, not about them. Use "you" and "your essay." Never use:
- Admissions predictions ("admissions officers will love this", "this will get you in")
- Score mechanics ("you lost points for", "this cost you")
- Empty hedging ("you might want to consider possibly")
- Praise sandwiches — say the useful thing directly

Write in plain, concrete English. Complete sentences. No bullet fragments inside your prose fields.`;

const DIMENSION_GUIDE = `- distinctiveness: whether the essay reveals a person few other applicants could be
- specificity: whether details are concrete and lived-in rather than general
- reflection: whether the writer shows how the experience changed their later thinking or behavior
- voice: whether a consistent, self-aware human presence comes through
- structure: whether the essay's shape serves its material and keeps moving
- memorability: whether any image or line will survive in a reader's memory
- prose_control: whether the sentences are controlled and unobtrusive`;

export function buildFeedbackUserMessage(opts: {
  essay: string;
  score: number;
  tier: string;
  dimensions: DimensionScores;
  strongestSignal: string;
  focusArea: string;
}): string {
  const dimLines = Object.entries(opts.dimensions)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `  ${k}: ${v}`)
    .join("\n");

  return `A student has submitted the essay below for evaluation. Margin's scoring engine has already placed it against a ranked reference field. Your job is the written coaching — the engine does not write feedback.

# Scoring engine output

Margin score: ${opts.score} out of 100 (tier: ${opts.tier})
Scale calibration: ~45 is a polished, sincere, unremarkable essay. 65+ is genuinely distinctive. 80+ is near-nonexistent.

Dimension scores (0-100), highest first:
${dimLines}

Strongest dimension: ${opts.strongestSignal}
Weakest dimension: ${opts.focusArea}

What the dimensions mean:
${DIMENSION_GUIDE}

Treat these scores as given. Your feedback must be consistent with them — do not tell the student their reflection is excellent if reflection scored 40. Your job is to explain, in terms of the actual text, *why* the essay landed where it did and what specifically to do about it.

# The essay

<essay>
${opts.essay}
</essay>

# What to produce

**reader_snapshot** — How the essay currently lands on a careful reader.
- current_impression: 2-3 sentences on the person who comes through. Be honest and precise; this is the first thing the student reads.
- memorable_element: the single passage most likely to stay with a reader, quoted EXACTLY from the essay. If nothing is genuinely memorable, quote the closest candidate and be honest about it in the other fields.
- missing_dimension: the most important thing a reader finishes still wanting to understand. One or two sentences, concrete.

**dimension_details** — One entry for each of the seven dimensions, ordered strongest to weakest.
- interpretation: one sentence on what this score means for THIS essay specifically. Not a definition of the dimension.
- what_readers_saw: 1-2 sentences on the pattern across the essay that produced this score.
- excerpt: a short passage exemplifying the pattern, quoted EXACTLY. Use different excerpts across dimensions where you can.
- why_it_matters: one sentence on why this dimension affects how the essay is received.
- revision_question: a question the writer can actually sit down and answer. Not "how could you improve voice?" but a question about their specific material.
- confidence_language: one short phrase on how consistent this pattern was.

**strengths** — EXACTLY TWO. The two things most worth protecting during revision. Not the two highest scores necessarily — the two things that make this essay this writer's.
- title: a short, concrete phrase naming the strength.
- explanation: 2-3 sentences on what the writer is doing well, precisely.
- excerpt: quoted EXACTLY.
- why_it_matters: what this does for the reader.
- protect_note: one sentence warning them how revision could accidentally destroy this.

**revision_priorities** — EXACTLY THREE, ordered by how much the essay improves if fixed. This is the heart of the feedback.
- diagnosis: 2-3 sentences naming the underlying problem, not the surface symptom. Reference specific parts of the essay.
- excerpt: the passage that best shows the problem, quoted EXACTLY.
- why_it_matters: what this costs the essay with a real reader.
- direction: what to actually do. Concrete and bounded — an action they can complete, not a goal to aspire to. Do not write replacement prose.
- question: the question that unlocks the revision.
- success_test: how the writer will know they have fixed it. Something checkable, e.g. "a reader should be able to finish the sentence: this experience changed the writer by ___."

**next_draft_plan** — 3 to 5 steps, in the order the student should do them. Each step is one imperative sentence naming a specific action on this specific essay. Include at least one step that protects something good. The final step should be to submit the revised draft.

Every excerpt across every field must appear character-for-character in the essay above.`;
}

/** JSON Schema for the structured output. Kept flat and simple: structured
 *  outputs reject numeric/array-length constraints, so exact counts (two
 *  strengths, three priorities) are enforced in the prompt and trimmed in
 *  code rather than declared here. */
export const FEEDBACK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "reader_snapshot",
    "dimension_details",
    "strengths",
    "revision_priorities",
    "next_draft_plan",
  ],
  properties: {
    reader_snapshot: {
      type: "object",
      additionalProperties: false,
      required: ["current_impression", "memorable_element", "missing_dimension"],
      properties: {
        current_impression: { type: "string" },
        memorable_element: { type: "string" },
        missing_dimension: { type: "string" },
      },
    },
    dimension_details: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "key",
          "interpretation",
          "what_readers_saw",
          "excerpt",
          "why_it_matters",
          "revision_question",
          "confidence_language",
        ],
        properties: {
          key: {
            type: "string",
            enum: [
              "distinctiveness",
              "specificity",
              "reflection",
              "voice",
              "structure",
              "memorability",
              "prose_control",
            ],
          },
          interpretation: { type: "string" },
          what_readers_saw: { type: "string" },
          excerpt: { type: "string" },
          why_it_matters: { type: "string" },
          revision_question: { type: "string" },
          confidence_language: { type: "string" },
        },
      },
    },
    strengths: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "title", "explanation", "excerpt", "why_it_matters", "protect_note"],
        properties: {
          category: {
            type: "string",
            enum: [
              "distinctiveness",
              "specificity",
              "reflection",
              "voice",
              "structure",
              "memorability",
              "prose_control",
            ],
          },
          title: { type: "string" },
          explanation: { type: "string" },
          excerpt: { type: "string" },
          why_it_matters: { type: "string" },
          protect_note: { type: "string" },
        },
      },
    },
    revision_priorities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "category",
          "diagnosis",
          "excerpt",
          "why_it_matters",
          "direction",
          "question",
          "success_test",
        ],
        properties: {
          category: {
            type: "string",
            enum: [
              "distinctiveness",
              "specificity",
              "reflection",
              "voice",
              "structure",
              "memorability",
              "prose_control",
            ],
          },
          diagnosis: { type: "string" },
          excerpt: { type: "string" },
          why_it_matters: { type: "string" },
          direction: { type: "string" },
          question: { type: "string" },
          success_test: { type: "string" },
        },
      },
    },
    next_draft_plan: {
      type: "array",
      items: { type: "string" },
    },
  },
} as const;
