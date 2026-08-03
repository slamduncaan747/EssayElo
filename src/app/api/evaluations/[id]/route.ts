import { NextResponse } from "next/server";
import { handleApiError, requireUser } from "@/lib/api";
import { isUuid } from "@/lib/validate";
import { eventsFromRow } from "@/lib/evaluation/fromRow";
import type { Evaluation } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Current state of an evaluation, as the event(s) a transport would have
 * emitted for it. Read-only — used on page load/refresh/reconnection to
 * reconstruct the screen without re-triggering scoring.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isUuid(id)) throw Object.assign(new Error("Not found"), { status: 404 });
    const ctx = await requireUser();

    const { data } = await ctx.db
      .from("evaluations")
      .select("*")
      .eq("id", id)
      .eq("user_id", ctx.user.id)
      .single();
    if (!data) throw Object.assign(new Error("Not found"), { status: 404 });

    return NextResponse.json({ events: eventsFromRow(data as Evaluation) });
  } catch (e) {
    return handleApiError(e);
  }
}
