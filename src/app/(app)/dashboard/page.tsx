import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";
import { ScoreMeter, TierBadge } from "@/components/Score";
import { getProfile, listEssays } from "@/lib/data";
import { supabaseServer } from "@/lib/supabase/server";
import { bandFromElo, eloToScore } from "@/lib/engine/scale";
import { tierForBand, tierForScore } from "@/lib/tier";
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
  const isPlus = profile.plan === "plus";

  // Best score across every finished evaluation, for the stat row.
  const scored = items
    .filter((i) => i.latestEval?.status === "done" && i.latestEval.elo != null)
    .map((i) => eloToScore(i.latestEval!.elo!));
  const best = scored.length ? Math.max(...scored) : null;

  // Progress strip: draft-history of the most recently updated scored essay.
  const progressItem = items.find((i) => i.latestEval && i.latestEval.status === "done");
  let progress: { title: string; id: string; bars: number[]; delta: number | null } | null = null;
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
        id: progressItem.essay.id,
        bars: scores.slice(-6),
        delta: scores.length > 1 ? Math.round(scores[scores.length - 1] - scores[0]) : null,
      };
    }
  }

  return (
    <div className="shell">
      <Sidebar plan={profile.plan} items={items} active="essays" evalsLeft={left} />
      <main className="main">
        <div className="page">
          {upgraded ? (
            <div className="banner banner-green pop-in">
              <Icon name="crown" size={20} />
              Welcome to Plus — exact scores and full line-by-line reviews are unlocked.
            </div>
          ) : null}

          <div className="spread" style={{ flexWrap: "wrap" }}>
            <div className="stack" style={{ gap: 3 }}>
              <h1 className="h1">Your essays</h1>
              <span className="small">
                {items.length
                  ? `${items.length} essay${items.length === 1 ? "" : "s"} · ${left} evaluation${left === 1 ? "" : "s"} left this month`
                  : "Nothing scored yet — paste an essay to get your first number."}
              </span>
            </div>
            <Link href="/essays/new" className="btn btn-primary">
              <Icon name="plus" size={18} />
              Score an essay
            </Link>
          </div>

          <div className="stat-row">
            <div className="stat">
              <span
                className="stat-icon"
                style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
              >
                <Icon name="stack" size={20} />
              </span>
              <div>
                <b>{items.length}</b>
                <span>Essays</span>
              </div>
            </div>
            <div className="stat">
              <span
                className="stat-icon"
                style={{ background: "var(--gold-soft)", color: "var(--gold-press)" }}
              >
                <Icon name="trophy" size={20} />
              </span>
              <div>
                <b>{best != null ? (isPlus ? best.toFixed(1) : Math.round(best)) : "—"}</b>
                <span>Best score</span>
              </div>
            </div>
            <div className="stat">
              <span
                className="stat-icon"
                style={{ background: "var(--green-soft)", color: "var(--green-ink)" }}
              >
                <Icon name="bolt" size={20} />
              </span>
              <div>
                <b>{left}</b>
                <span>Evaluations left</span>
              </div>
            </div>
            <div className="stat">
              <span
                className="stat-icon"
                style={{ background: "var(--cream-2)", color: "var(--muted)" }}
              >
                <Icon name="crown" size={20} />
              </span>
              <div>
                <b style={{ textTransform: "capitalize" }}>{profile.plan}</b>
                <span>{isPlus ? "Exact scores on" : "Bands only"}</span>
              </div>
            </div>
          </div>

          {progress ? (
            <Link href={`/essays/${progress.id}`} className="card card-lift" style={{ padding: 20 }}>
              <div className="spread" style={{ gap: 24, flexWrap: "wrap" }}>
                <div className="stack" style={{ gap: 4, minWidth: 150 }}>
                  <span className="label">Progress</span>
                  <span className="h3">{progress.title}</span>
                  <span className="tiny">across {progress.bars.length} evaluations</span>
                </div>
                <div className="bars" style={{ flex: 1, minWidth: 160, height: 62 }}>
                  {progress.bars.map((s, i) => {
                    const last = i === progress!.bars.length - 1;
                    return (
                      <div
                        key={i}
                        className="bar"
                        title={`${Math.round(s)}`}
                        style={{
                          height: `${Math.max(s, 5)}%`,
                          background: last ? tierForScore(s).color : "var(--cream-2)",
                        }}
                      />
                    );
                  })}
                </div>
                {progress.delta != null ? (
                  <div className="stack" style={{ gap: 2, alignItems: "flex-end" }}>
                    <span
                      className="h2 num"
                      style={{
                        color:
                          progress.delta >= 0 ? "var(--green-ink)" : "var(--red-ink)",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {progress.delta >= 0 ? <Icon name="arrowUp" size={17} /> : null}
                      {progress.delta >= 0 ? "+" : ""}
                      {progress.delta} pts
                    </span>
                    <span className="tiny">since draft 1</span>
                  </div>
                ) : null}
              </div>
            </Link>
          ) : null}

          <div className="essay-grid">
            {items.map(({ essay, latestDraft, latestEval }) => {
              const done =
                latestEval?.status === "done" && latestEval.elo != null && latestEval.ci != null;
              const running = latestEval?.status === "running";
              const band = done ? bandFromElo(latestEval!.elo!, latestEval!.ci!) : null;
              const exact = done ? eloToScore(latestEval!.elo!) : null;
              const tier = band ? tierForBand(band.low, band.high) : null;

              return (
                <div key={essay.id} className="card card-lift essay-card">
                  <div className="essay-card-head">
                    <span className="essay-card-title">{essay.title}</span>
                    <span className="chip">Draft {latestDraft?.version ?? 1}</span>
                  </div>

                  {running ? (
                    <div className="stack" style={{ gap: 10 }}>
                      <span className="live-badge">
                        <span className="pulse-dot" />
                        Evaluating
                      </span>
                      <div className="meter meter-sm">
                        <div
                          className="meter-fill"
                          style={{
                            left: 0,
                            width: `${Math.round((latestEval!.matches_done / Math.max(latestEval!.budget, 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : done ? (
                    <div className="stack" style={{ gap: 10 }}>
                      <div className="spread">
                        <span className="essay-score" style={{ color: tier!.ink }}>
                          {isPlus ? exact!.toFixed(1) : `${band!.low}–${band!.high}`}
                        </span>
                        <TierBadge tier={tier!} />
                      </div>
                      <ScoreMeter
                        low={band!.low}
                        high={band!.high}
                        color={tier!.color}
                        ticks={false}
                      />
                    </div>
                  ) : (
                    <div className="stack" style={{ gap: 10 }}>
                      <span className="h3" style={{ color: "var(--faint)" }}>
                        Not scored yet
                      </span>
                      <div className="meter meter-sm" />
                    </div>
                  )}

                  <div className="spread">
                    <span className="tiny">
                      {essay.essay_type.replace(" personal statement", "")} ·{" "}
                      {latestDraft?.word_count ?? 0} words
                    </span>
                    <span className="tiny">{fmtDate(essay.updated_at)}</span>
                  </div>

                  <div className="essay-card-actions">
                    <Link href={`/essays/${essay.id}`} className="btn btn-plain btn-sm">
                      Review
                    </Link>
                    <Link href={`/essays/${essay.id}/edit`} className="btn btn-primary btn-sm">
                      <Icon name="pencil" size={14} />
                      Edit
                    </Link>
                  </div>
                </div>
              );
            })}

            <Link href="/essays/new" className="add-card">
              <span className="add-card-mark">
                <Icon name="plus" size={22} strokeWidth={2.6} />
              </span>
              <span className="h3">Score a new essay</span>
              <span className="tiny">Paste it in — we clean the formatting</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
