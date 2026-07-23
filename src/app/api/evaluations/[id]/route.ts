import { NextResponse } from "next/server";
import { handleApiError, requireOwnedEvaluation, requireUser } from "@/lib/api";
import { ApiError, isUuid } from "@/lib/validate";
import { evaluationView } from "@/lib/serialize";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isUuid(id)) throw new ApiError(400, "Invalid id");
    const ctx = await requireUser();
    const ev = await requireOwnedEvaluation(ctx, id);
    return NextResponse.json(evaluationView(ev, ctx.plan));
  } catch (e) {
    return handleApiError(e);
  }
}
