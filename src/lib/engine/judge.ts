/**
 * LLM judge calls: placement, order-swapped head-to-head, prose. Position bias
 * is defeated structurally — every match is judged twice, once per ordering,
 * and the pair is resolved by reliability.resolveSwapPair.
 */

import type { Harvest, Margin } from "@/lib/types";
import { cheapModel, isMock, judgeModel, structuredCall } from "@/lib/anthropic";
import {
  COMPARE_BATCH_HINT,
  COMPARE_BATCH_SCHEMA,
  COMPARE_BATCH_SYSTEM,
  compareBatchUser,
  COMPARE_SCHEMA,
  COMPARE_SYSTEM,
  compareUser,
  PLACEMENT_SCHEMA,
  PLACEMENT_SYSTEM,
  placementUser,
  PROSE_SCHEMA,
  PROSE_SYSTEM,
  proseUser,
} from "./prompts";
import { mockCompare, mockPlacement, mockProse } from "./mock";
import type { SingleVerdict } from "./reliability";

interface CompareSide {
  most_producible_revelation: string;
  producibility_estimate: string;
  met_person_moment: string | null;
  wasted_opportunity: string | null;
}

interface CompareOutput {
  winner: "A" | "B";
  margin: Margin;
  decisive_differentiator: string;
  axis: Harvest["axis"];
  winner_reason: string;
  loser_reason: string;
  a: CompareSide;
  b: CompareSide;
  direction_flag: { essay: "A" | "B"; note: string } | null;
}

export async function judgePlacement(essay: string): Promise<number> {
  if (isMock()) return mockPlacement(essay).tier;
  const out = await structuredCall<{ tier: number }>({
    model: cheapModel(),
    system: PLACEMENT_SYSTEM,
    user: placementUser(essay),
    schema: PLACEMENT_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 300,
  });
  return out.tier;
}

/**
 * One reading of a pair. `userIsA` records which position the user's essay
 * occupied so the verdict can be normalized back to user-relative terms.
 */
async function judgeOnce(
  userEssay: string,
  oppEssay: string,
  userIsA: boolean
): Promise<SingleVerdict> {
  const essayA = userIsA ? userEssay : oppEssay;
  const essayB = userIsA ? oppEssay : userEssay;

  let out: CompareOutput;
  if (isMock()) {
    const m = mockCompare(essayA, essayB);
    const userSide: "A" | "B" = userIsA ? "A" : "B";
    const userWon = m.winner === userSide;
    return { userWon, margin: m.margin, harvest: m.harvestFor(userSide, userWon) };
  }

  out = await structuredCall<CompareOutput>({
    model: judgeModel(),
    system: COMPARE_SYSTEM,
    user: compareUser(essayA, essayB),
    schema: COMPARE_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 1500,
  });

  // Winner + margin are load-bearing (they drive the Elo). Everything else is
  // harvest — default it rather than crash a whole evaluation on a smaller
  // model's occasional missing field.
  if (out.winner !== "A" && out.winner !== "B") {
    throw new Error("judge returned no winner");
  }
  const margin: Margin =
    out.margin === "decisive" || out.margin === "clear" || out.margin === "narrow"
      ? out.margin
      : "narrow";
  const userSide: "A" | "B" = userIsA ? "A" : "B";
  const userWon = out.winner === userSide;
  const side = (userIsA ? out.a : out.b) ?? ({} as CompareSide);
  const df = out.direction_flag;
  const harvest: Harvest = {
    decisive_differentiator: out.decisive_differentiator ?? "",
    axis: out.axis ?? "producibility",
    win_reason: userWon ? out.winner_reason ?? null : null,
    loss_reason: userWon ? null : out.loser_reason ?? null,
    most_producible_revelation: side.most_producible_revelation ?? "",
    producibility_estimate: side.producibility_estimate ?? "",
    met_person_moment: side.met_person_moment ?? null,
    wasted_opportunity: side.wasted_opportunity ?? null,
    direction_flag: df && df.essay === userSide ? df.note : null,
  };
  return { userWon, margin, harvest };
}

/** Both orderings of one match, in parallel. */
export async function judgeMatchPair(
  userEssay: string,
  oppEssay: string
): Promise<[SingleVerdict, SingleVerdict]> {
  return Promise.all([
    judgeOnce(userEssay, oppEssay, true),
    judgeOnce(userEssay, oppEssay, false),
  ]);
}

/**
 * A single reading with a randomized presentation order — used when
 * JUDGE_SINGLE_READING=1 (e.g. token-limited free tiers). Position bias is
 * averaged out across matches by the per-match coin flip rather than by
 * running each match twice.
 */
export async function judgeSingle(
  userEssay: string,
  oppEssay: string
): Promise<SingleVerdict> {
  return judgeOnce(userEssay, oppEssay, Math.random() < 0.5);
}

/** One verdict from a batched call, normalized to user-relative terms. */
export interface BatchVerdict {
  /** Index into the opponents array passed to judgeBatch. */
  index: number;
  verdict: SingleVerdict;
}

interface BatchOutput {
  verdicts: Array<{
    rival: number;
    winner: "mine" | "rival";
    margin: Margin;
    differentiator: string;
    axis: Harvest["axis"];
    reason: string;
  }>;
  most_producible_revelation: string;
  producibility_estimate: string;
  met_person_moment: string | null;
  wasted_opportunity: string | null;
  direction_flag: string | null;
}

/**
 * Judge the user's essay against several opponents in ONE call. The system
 * prompt, the schema, and the user's essay are sent once rather than once per
 * match — cutting per-match token cost several-fold, which is what makes
 * token-limited free tiers viable.
 *
 * Tradeoff: verdicts within a batch share one reading, so their noise is
 * correlated in a way independent calls' noise is not. The prompt instructs
 * per-rival independence, and cross-match intransitivity still widens the
 * confidence interval. Set JUDGE_BATCH_SIZE=1 for fully independent matches.
 */
export async function judgeBatch(
  userEssay: string,
  opponents: string[]
): Promise<BatchVerdict[]> {
  if (opponents.length === 0) return [];

  if (isMock()) {
    return opponents.map((opp, i) => {
      const m = mockCompare(userEssay, opp);
      const userWon = m.winner === "A";
      return {
        index: i,
        verdict: { userWon, margin: m.margin, harvest: m.harvestFor("A", userWon) },
      };
    });
  }

  const out = await structuredCall<BatchOutput>({
    model: judgeModel(),
    system: COMPARE_BATCH_SYSTEM,
    user: compareBatchUser(userEssay, opponents),
    schema: COMPARE_BATCH_SCHEMA as unknown as Record<string, unknown>,
    schemaHint: COMPARE_BATCH_HINT,
    maxTokens: 600 + opponents.length * 220,
  });

  const shared = {
    most_producible_revelation: out.most_producible_revelation ?? "",
    producibility_estimate: out.producibility_estimate ?? "",
    met_person_moment: out.met_person_moment ?? null,
    wasted_opportunity: out.wasted_opportunity ?? null,
    direction_flag: out.direction_flag ?? null,
  };

  const results: BatchVerdict[] = [];
  for (const v of out.verdicts ?? []) {
    const index = Number(v.rival) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= opponents.length) continue;
    if (v.winner !== "mine" && v.winner !== "rival") continue;
    const userWon = v.winner === "mine";
    const margin: Margin =
      v.margin === "decisive" || v.margin === "clear" || v.margin === "narrow"
        ? v.margin
        : "narrow";
    results.push({
      index,
      verdict: {
        userWon,
        margin,
        harvest: {
          decisive_differentiator: v.differentiator ?? "",
          axis: v.axis ?? "producibility",
          win_reason: userWon ? v.reason ?? null : null,
          loss_reason: userWon ? null : v.reason ?? null,
          ...shared,
        },
      },
    });
  }
  // Drop duplicate rival indices (a model occasionally repeats one).
  const seen = new Set<number>();
  return results.filter((r) => !seen.has(r.index) && seen.add(r.index));
}

export async function judgeProse(
  essay: string
): Promise<{ prose_score: number; note: string }> {
  if (isMock()) return mockProse(essay);
  return structuredCall<{ prose_score: number; note: string }>({
    model: cheapModel(),
    system: PROSE_SYSTEM,
    user: proseUser(essay),
    schema: PROSE_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 300,
  });
}
