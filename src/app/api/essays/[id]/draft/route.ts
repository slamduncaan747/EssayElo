import { NextResponse } from "next/server";
import { handleApiError, requireOwnedEssay, requireUser } from "@/lib/api";
import { ApiError, isUuid, validateEssayContent, wordCount } from "@/lib/validate";

export const runtime = "nodejs";

/**
 * Autosave the working draft. The editor edits the highest draft version
 * that has no evaluation yet; if the latest version was already evaluated,
 * a new version is created (draft history stays immutable per evaluation).
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isUuid(id)) throw new ApiError(400, "Invalid id");
    const ctx = await requireUser();
    await requireOwnedEssay(ctx, id);

    const body = await req.json().catch(() => ({}));
    const content = validateEssayContent(body.content);

    const { data: latest } = await ctx.db
      .from("drafts")
      .select("id, version")
      .eq("essay_id", id)
      .order("version", { ascending: false })
      .limit(1)
      .single();
    if (!latest) throw new ApiError(404, "Draft not found");

    const { count } = await ctx.db
      .from("evaluations")
      .select("id", { count: "exact", head: true })
      .eq("draft_id", latest.id);

    if ((count ?? 0) > 0) {
      const { data: created, error } = await ctx.db
        .from("drafts")
        .insert({
          essay_id: id,
          version: latest.version + 1,
          content,
          word_count: wordCount(content),
        })
        .select("id, version")
        .single();
      if (error) throw new Error(error.message);
      await ctx.db.from("essays").update({ updated_at: new Date().toISOString() }).eq("id", id);
      return NextResponse.json({ draft_id: created.id, version: created.version });
    }

    const { error } = await ctx.db
      .from("drafts")
      .update({
        content,
        word_count: wordCount(content),
        updated_at: new Date().toISOString(),
      })
      .eq("id", latest.id);
    if (error) throw new Error(error.message);
    await ctx.db.from("essays").update({ updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ draft_id: latest.id, version: latest.version });
  } catch (e) {
    return handleApiError(e);
  }
}
