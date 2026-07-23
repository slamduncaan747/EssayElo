/**
 * LLM judge calls: placement, order-swapped head-to-head, prose. Position bias
 * is defeated structurally — every match is judged twice, once per ordering,
 * and the pair is resolved by reliability.resolveSwapPair.
 */

import type { Harvest, Margin } from "@/lib/types";
import { JUDGE_MODEL, MOCK_JUDGE, structuredCall } from "@/lib/anthropic";
import {
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
  if (MOCK_JUDGE) return mockPlacement(essay).tier;
  const out = await structuredCall<{ tier: number }>({
    model: JUDGE_MODEL,
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
  if (MOCK_JUDGE) {
    const m = mockCompare(essayA, essayB);
    const userSide: "A" | "B" = userIsA ? "A" : "B";
    const userWon = m.winner === userSide;
    return { userWon, margin: m.margin, harvest: m.harvestFor(userSide, userWon) };
  }

  out = await structuredCall<CompareOutput>({
    model: JUDGE_MODEL,
    system: COMPARE_SYSTEM,
    user: compareUser(essayA, essayB),
    schema: COMPARE_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 1500,
  });

  const userSide: "A" | "B" = userIsA ? "A" : "B";
  const userWon = out.winner === userSide;
  const side = userIsA ? out.a : out.b;
  const harvest: Harvest = {
    decisive_differentiator: out.decisive_differentiator,
    axis: out.axis,
    win_reason: userWon ? out.winner_reason : null,
    loss_reason: userWon ? null : out.loser_reason,
    most_producible_revelation: side.most_producible_revelation,
    producibility_estimate: side.producibility_estimate,
    met_person_moment: side.met_person_moment,
    wasted_opportunity: side.wasted_opportunity,
    direction_flag:
      out.direction_flag && out.direction_flag.essay === userSide
        ? out.direction_flag.note
        : null,
  };
  return { userWon, margin: out.margin, harvest };
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

export async function judgeProse(
  essay: string
): Promise<{ prose_score: number; note: string }> {
  if (MOCK_JUDGE) return mockProse(essay);
  return structuredCall<{ prose_score: number; note: string }>({
    model: JUDGE_MODEL,
    system: PROSE_SYSTEM,
    user: proseUser(essay),
    schema: PROSE_SCHEMA as unknown as Record<string, unknown>,
    maxTokens: 300,
  });
}
