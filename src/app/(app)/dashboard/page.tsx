import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";
import { Medal, Rank, ScoreMeter } from "@/components/Score";
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

  const scored = items
    .filter((i) => i.latestEval?.status === "done" && i.latestEval.elo != null)
    .map((i) => eloToScore(i.latestEval!.elo!));
  const best = scored.length ? Math.max(...scored) : null;
  const bestTier = best != null ? tierForScore(best) : null;

  // Progress strip: every finished score for the most recently updated essay.
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
        bars: scores.slice(-8),
        delta: scores.length > 1 ? Math.round(scores[scores.length - 1] - scores[0]) : null,
      };
    }
  }

  return (
    <div className="shell">
      <Sidebar
        plan={profile.plan}
        items={items}
        active="essays"
        evalsLeft={left}
        evalsTotal={limit}
      />
      <main className="main">
        <div className="page">
          {upgraded ? (
            <div className="banner banner-green pop-in">
              <Icon name="crown" size={20} />
              Welcome to Plus — exact scores and full line-by-line reviews are unlocked.
            </div>
          ) : null}

          <div className="masthead">
            <div className="stack g2">
              <h1 className="h1">Your essays</h1>
              <span className="small">
                {items.length
                  ? `${items.length} essay${items.length === 1 ? "" : "s"} · ${left} of ${limit} evaluations left this month`
                  : "Nothing scored yet — paste an essay to get your first number."}
              </span>
            </div>
            <Link href="/essays/new" className="btn btn-primary">
              <Icon name="plus" size={18} />
              Score an essay
            </Link>
          </div>

          <div className="stats">
            <div className="stat">
              <span className="stat-icon" style={{ background: "var(--brand-50)", color: "var(--brand)" }}>
                <Icon name="essays" size={21} />
              </span>
              <div>
                <b>{items.length}</b>
                <span>Essays</span>
              </div>
            </div>
            <div className="stat">
              <span className="stat-icon" style={{ background: "var(--gold-50)", color: "var(--gold-press)" }}>
                <Icon name="trophy" size={21} />
              </span>
              <div>
                <b style={{ color: bestTier?.ink }}>
                  {best != null ? (isPlus ? best.toFixed(1) : Math.round(best)) : "—"}
                </b>
                <span>{bestTier ? bestTier.name : "Best score"}</span>
              </div>
            </div>
            <div className="stat">
              <span className="stat-icon" style={{ background: "var(--green-50)", color: "var(--green-ink)" }}>
                <Icon name="bolt" size={21} />
              </span>
              <div>
                <b>{left}</b>
                <span>Evaluations left</span>
              </div>
            </div>
            <div className="stat">
              <span
                className="stat-icon"
                style={{
                  background: isPlus ? "var(--gold-50)" : "var(--sunken)",
                  color: isPlus ? "var(--gold-press)" : "var(--text-3)",
                }}
              >
                <Icon name="crown" size={21} />
              </span>
              <div>
                <b style={{ textTransform: "capitalize" }}>{profile.plan}</b>
                <span>{isPlus ? "Exact scores on" : "Bands only"}</span>
              </div>
            </div>
          </div>

          {progress ? (
            <Link href={`/essays/${progress.id}`} className="card card-tap card-pad">
              <div className="spread wrap" style={{ gap: "var(--s6)" }}>
                <div className="stack g2" style={{ minWidth: 170 }}>
                  <span className="label">Progress</span>
                  <span className="h3">{progress.title}</span>
                  <span className="tiny">across {progress.bars.length} evaluations</span>
                </div>
                <div className="bars grow" style={{ height: 76, minWidth: 180 }}>
                  {progress.bars.map((s, i) => {
                    const last = i === progress!.bars.length - 1;
                    return (
                      <div
                        key={i}
                        className="bar"
                        title={`${Math.round(s)}`}
                        style={{
                          height: `${Math.max(s, 6)}%`,
                          background: last ? tierForScore(s).color : "var(--n-200)",
                        }}
                      />
                    );
                  })}
                </div>
                {progress.delta != null ? (
                  <div className="stack g1" style={{ alignItems: "flex-end" }}>
                    <span
                      className="h1 num"
                      style={{
                        color: progress.delta >= 0 ? "var(--green-ink)" : "var(--red-ink)",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      {progress.delta >= 0 ? <Icon name="arrowUp" size={20} /> : null}
                      {progress.delta >= 0 ? "+" : ""}
                      {progress.delta}
                    </span>
                    <span className="tiny">points since draft 1</span>
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
              const display = done
                ? isPlus
                  ? exact!.toFixed(1)
                  : `${band!.low}–${band!.high}`
                : "—";

              return (
                <div key={essay.id} className="card card-tap essay-card">
                  <div className="essay-card-head">
                    <span className="essay-card-title">{essay.title}</span>
                    <span className="chip">Draft {latestDraft?.version ?? 1}</span>
                  </div>

                  {running ? (
                    <div className="stack g3">
                      <span className="live">
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
                      <span className="tiny">
                        {latestEval!.matches_done} of {latestEval!.budget} matchups judged
                      </span>
                    </div>
                  ) : done ? (
                    <div className="stack g4">
                      <div className="row g4">
                        <Medal value={exact!} display={display} size={62} />
                        <div className="stack g2">
                          <Rank tier={tier!} />
                          <span className="tiny">out of 100</span>
                        </div>
                      </div>
                      <ScoreMeter
                        low={band!.low}
                        high={band!.high}
                        color={tier!.color}
                        ticks={false}
                        small
                      />
                    </div>
                  ) : (
                    <div className="stack g4">
                      <div className="row g4">
                        <span
                          className="medal"
                          style={{
                            width: 62,
                            height: 62,
                            background: "var(--sunken)",
                            color: "var(--text-4)",
                            fontSize: 22,
                            boxShadow: "none",
                          }}
                        >
                          —
                        </span>
                        <span className="small">Not scored yet</span>
                      </div>
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

                  <div className="essay-card-foot">
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
                <Icon name="plus" size={24} strokeWidth={2.4} />
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
