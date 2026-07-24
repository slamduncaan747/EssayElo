import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { handleApiError, requireOwnedEvaluation, requireUser } from "@/lib/api";
import { ApiError, isUuid } from "@/lib/validate";
import { stepEvaluation } from "@/lib/engine/tournament";
import {
  configFor,
  ENGINE_COOKIE,
  isPreset,
  runWithEngine,
} from "@/lib/engine/config";

export const runtime = "nodejs";
// One step = at most two judge calls; generous ceiling for slow model turns.
export const maxDuration = 300;

/**
 * Advance the evaluation state machine by one unit. The evaluating screen
 * polls this endpoint in a loop; the atomic row lock makes concurrent calls
 * safe (extras return busy:true).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isUuid(id)) throw new ApiError(400, "Invalid id");
    const ctx = await requireUser();
    await requireOwnedEvaluation(ctx, id);

    // Testing override: run this step under the engine preset selected in the
    // UI (mock / fast / quality). Falls back to the environment.
    const preset =
      process.env.ALLOW_PLAN_TOGGLE === "1"
        ? (await cookies()).get(ENGINE_COOKIE)?.value
        : undefined;
    const result = isPreset(preset)
      ? await runWithEngine(configFor(preset), () => stepEvaluation(ctx.db, id))
      : await stepEvaluation(ctx.db, id);

    return NextResponse.json(result);
  } catch (e) {
    return handleApiError(e);
  }
}
