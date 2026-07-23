import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { getProfile, listEssays } from "@/lib/data";
import { supabaseServer } from "@/lib/supabase/server";
import { bandFromElo, eloToScore } from "@/lib/engine/scale";
import { fullEvalsUsedThisMonth, TIER } from "@/lib/quota";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Evaluation } from "@/lib/types";

export const metadata = { title: "Your essays — Margin" };
export const dynamic = "force-dynamic";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const [{ upgraded }, profile, items] = await Promise.all([
    searchParams,
    getProfile(),
    listEssays(),
  ]);
  if (!profile) return null;
  const used = await fullEvalsUsedThisMonth(supabaseAdmin(), profile.id);
  const limit = TIER[profile.plan].evalsPerMonth;
  const left = Math.max(0, limit - used);

  // Progress strip: draft-history bands of the most recently updated essay.
  const progressItem = items.find(
    (i) => i.latestEval && i.latestEval.status === "done"
  );
  let progress: { title: string; bars: number[]; delta: number | null } | null = null;
  if (progressItem) {
    const supabase = await supabaseServer();
    const { data: evals } = await supabase
      .from("evaluations")
      .select("elo, status, created_at")
      .eq("essay_id", progressItem.essay.id)
      .eq("status", "done")
      .order("created_at", { ascending: true });
    const scores = ((evals ?? []) as Pick<Evaluation, "elo">[])
      .filter((e) => e.elo != null)
      .map((e) => eloToScore(e.elo!));
    if (scores.length > 0) {
      progress = {
        title: progressItem.essay.title,
        bars: scores.slice(-5),
        delta: scores.length > 1 ? Math.round(scores[scores.length - 1] - scores[0]) : null,
      };
    }
  }

  return (
    <div className="shell">
      <Sidebar plan={profile.plan} items={items} active="essays" />
      <main className="main" style={{ padding: "30px 40px", gap: 22 }}>
        {upgraded ? (
          <div
            className="card"
            style={{
              padding: "12px 18px",
              font: "500 13px var(--sans)",
              color: "var(--green)",
              borderColor: "var(--green)",
            }}
          >
            Welcome to Plus — exact scores and full line-by-line reviews are unlocked.
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ font: "600 22px var(--serif)" }}>Your essays</span>
            <span style={{ font: "400 12.5px var(--sans)", color: "var(--muted)" }}>
              {left} {profile.plan === "free" ? "free " : ""}evaluation{left === 1 ? "" : "s"} left this month
            </span>
          </div>
          <Link href="/essays/new" className="btn btn-accent" style={{ padding: "11px 22px", fontSize: 13 }}>
            + Score an essay
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {items.map(({ essay, latestDraft, latestEval }) => {
            const done = latestEval?.status === "done" && latestEval.elo != null && latestEval.ci != null;
            const running = latestEval?.status === "running";
            const band = done ? bandFromElo(latestEval!.elo!, latestEval!.ci!) : null;
            const isPlus = profile.plan === "plus";
            return (
              <div key={essay.id} className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ font: "600 15px var(--serif)" }}>{essay.title}</span>
                  <span
                    style={{
                      font: "500 9.5px var(--mono)",
                      background: "var(--chip)",
                      color: "var(--muted)",
                      padding: "3px 7px",
                      borderRadius: 5,
                      whiteSpace: "nowrap",
                    }}
                  >
                    DRAFT {latestDraft?.version ?? 1}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  {running ? (
                    <span className="eval-status">
                      <span className="pulse-dot" />
                      EVALUATING
                    </span>
                  ) : done ? (
                    <span style={{ font: "600 32px/1 var(--serif)", color: "var(--accent)" }}>
                      {isPlus ? eloToScore(latestEval!.elo!).toFixed(1) : `${band!.low}–${band!.high}`}
                    </span>
                  ) : (
                    <span style={{ font: "600 18px var(--serif)", color: "var(--faint)" }}>
                      Not yet scored
                    </span>
                  )}
                </div>
                <div className="track track-light" style={{ height: 8 }}>
                  {band ? (
                    <div
                      className="track-fill"
                      style={{ left: `${band.low}%`, width: `${Math.max(band.high - band.low, 2)}%` }}
                    />
                  ) : null}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", font: "400 11px var(--sans)", color: "var(--faint)" }}>
                  <span>
                    {essay.essay_type.replace(" personal statement", "")} · {latestDraft?.word_count ?? 0} words
                  </span>
                  <span>{fmtDate(essay.updated_at)}</span>
                </div>
                <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--border-soft)", paddingTop: 12 }}>
                  <Link href={`/essays/${essay.id}`} className="btn btn-outline" style={{ flex: 1, padding: "8px 0", fontSize: 11.5, fontWeight: 500 }}>
                    Review
                  </Link>
                  <Link href={`/essays/${essay.id}/edit`} className="btn btn-dark" style={{ flex: 1, padding: "8px 0", fontSize: 11.5, fontWeight: 500 }}>
                    Edit
                  </Link>
                </div>
              </div>
            );
          })}

          <Link
            href="/essays/new"
            style={{
              border: "1.5px dashed #cfc6b3",
              borderRadius: 14,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              textAlign: "center",
              minHeight: 180,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "var(--chip)",
                display: "grid",
                placeItems: "center",
                font: "600 18px var(--serif)",
                color: "var(--accent)",
              }}
            >
              +
            </div>
            <span style={{ font: "600 13.5px var(--sans)" }}>Score a new essay</span>
            <span style={{ font: "400 11.5px var(--sans)", color: "var(--faint)" }}>
              Paste or drop a doc
            </span>
          </Link>
        </div>

        {progress ? (
          <div className="card" style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 130 }}>
              <span className="mono-label" style={{ letterSpacing: ".1em" }}>PROGRESS</span>
              <span style={{ font: "600 14px var(--serif)" }}>{progress.title}</span>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 6, height: 44 }}>
              {progress.bars.map((s, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${Math.max(s, 4)}%`,
                    background:
                      i === progress!.bars.length - 1 ? "var(--accent)" : i % 2 ? "#d9c9b2" : "#e9e2d2",
                    borderRadius: "3px 3px 0 0",
                  }}
                />
              ))}
              {Array.from({ length: Math.max(0, 5 - progress.bars.length) }).map((_, i) => (
                <div key={`e${i}`} style={{ flex: 1, height: "2%", background: "var(--chip)", borderRadius: "3px 3px 0 0" }} />
              ))}
            </div>
            {progress.delta != null ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "right" }}>
                <span style={{ font: "600 15px var(--serif)", color: "var(--accent)" }}>
                  {progress.delta >= 0 ? "+" : ""}
                  {progress.delta} pts
                </span>
                <span style={{ font: "400 11px var(--sans)", color: "var(--faint)" }}>since draft 1</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
