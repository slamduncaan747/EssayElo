import { NextResponse } from "next/server";
import { handleApiError, requireOwnedEvaluation, requireUser } from "@/lib/api";
import { ApiError, isUuid } from "@/lib/validate";
import { stepEvaluation } from "@/lib/engine/tournament";

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
    const result = await stepEvaluation(ctx.db, id);
    return NextResponse.json(result);
  } catch (e) {
    return handleApiError(e);
  }
}
