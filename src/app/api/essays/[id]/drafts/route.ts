import { NextResponse } from "next/server";
import { handleApiError, requireUser } from "@/lib/api";
import { isUuid } from "@/lib/validate";

export const runtime = "nodejs";

/**
 * Duplicates the essay's latest draft into a new, unevaluated version —
 * "Start Draft 2" never touches the version that was actually scored.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isUuid(id)) throw Object.assign(new Error("Not found"), { status: 404 });
    const ctx = await requireUser();

    const { data: essay } = await ctx.db
      .from("essays")
      .select("id")
      .eq("id", id)
      .eq("user_id", ctx.user.id)
      .single();
    if (!essay) throw Object.assign(new Error("Not found"), { status: 404 });

    const { data: latest } = await ctx.db
      .from("drafts")
      .select("*")
      .eq("essay_id", id)
      .order("version", { ascending: false })
      .limit(1)
      .single();
    if (!latest) throw Object.assign(new Error("No draft to duplicate"), { status: 404 });

    const { data: draft, error: draftErr } = await ctx.db
      .from("drafts")
      .insert({
        essay_id: id,
        version: latest.version + 1,
        content: latest.content,
        word_count: latest.word_count,
      })
      .select()
      .single();
    if (draftErr) throw new Error(draftErr.message);

    return NextResponse.json({ draft_id: draft.id, version: draft.version }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
