import { NextResponse } from "next/server";
import { handleApiError, requireUser } from "@/lib/api";
import { ApiError } from "@/lib/validate";
import { configFor, ENGINE_COOKIE, isPreset } from "@/lib/engine/config";

export const runtime = "nodejs";

/**
 * TESTING ONLY — choose which engine runs evaluations for this browser.
 * Gated behind ALLOW_PLAN_TOGGLE=1, same as the plan toggle.
 */
export async function POST(req: Request) {
  try {
    if (process.env.ALLOW_PLAN_TOGGLE !== "1") throw new ApiError(404, "Not found");
    await requireUser();

    const body = await req.json().catch(() => ({}));
    if (!isPreset(body.preset)) throw new ApiError(400, "Unknown preset");

    const cfg = configFor(body.preset);
    const res = NextResponse.json({
      preset: cfg.preset,
      judgeModel: cfg.mock ? "mock" : cfg.judgeModel,
    });
    res.cookies.set(ENGINE_COOKIE, body.preset, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (e) {
    return handleApiError(e);
  }
}
