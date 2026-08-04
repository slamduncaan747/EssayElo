import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";
import { Medal, Rank, ScoreMeter } from "@/components/Score";
import { getProfile, listEssays } from "@/lib/data";
import { tierForScore } from "@/lib/tier";
import { fullEvalsUsedThisMonth, TIER } from "@/lib/quota";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata = { title: "Your evaluations — Margin" };
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
    .filter((i) => i.latestEval?.status === "done" && i.latestEval.result)
    .map((i) => i.latestEval!.result!.score);
  const best = scored.length ? Math.max(...scored) : null;
  const bestTier = best != null ? tierForScore(best) : null;

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
              <h1 className="h1">Your evaluations</h1>
              <span className="small">
                {items.length
                  ? `${items.length} evaluation${items.length === 1 ? "" : "s"} · ${left} of ${limit} left this month`
                  : "Nothing scored yet — paste an essay to get your first number."}
              </span>
            </div>
            <Link href="/essays/new" className="btn btn-primary">
              <Icon name="plus" size={18} />
              New evaluation
            </Link>
          </div>

          <div className="stats">
            <div className="stat">
              <span className="stat-icon" style={{ background: "var(--brand-50)", color: "var(--brand)" }}>
                <Icon name="essays" size={21} />
              </span>
              <div>
                <b>{items.length}</b>
                <span>Evaluations</span>
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
                <span>Best score</span>
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
          </div>

          <div className="essay-grid">
            {items.map(({ essay, latestDraft, latestEval }) => {
              const done = latestEval?.status === "done" && !!latestEval.result;
              const running = latestEval?.status === "running";
              const result = done ? latestEval!.result! : null;
              const tier = result ? tierForScore(result.score) : null;
              const display = result
                ? isPlus
                  ? result.score.toFixed(1)
                  : `${result.scoreInterval.low}–${result.scoreInterval.high}`
                : "—";

              return (
                <Link key={essay.id} href={`/essays/${essay.id}`} className="card card-tap essay-card">
                  <div className="essay-card-head">
                    <span className="essay-card-title">{essay.title}</span>
                  </div>

                  {result ? (
                    <div className="stack g4">
                      <div className="row g4">
                        <Medal value={result.score} display={display} size={62} />
                        <div className="stack g2">
                          <Rank tier={tier!} />
                          <span className="tiny">Margin score</span>
                        </div>
                      </div>
                      <ScoreMeter
                        low={result.scoreInterval.low}
                        high={result.scoreInterval.high}
                        color={tier!.color}
                        ticks={false}
                        small
                      />
                    </div>
                  ) : running ? (
                    <div className="stack g4">
                      <div className="row g4">
                        <span className="medal-live" aria-hidden="true">
                          <span className="medal-live-ring" />
                          <Icon name="compass" size={22} />
                        </span>
                        <div className="stack g1">
                          <b style={{ fontSize: 14, color: "var(--brand-ink)" }}>
                            Analysis in progress
                          </b>
                          <span className="tiny">Margin is reading your draft</span>
                        </div>
                      </div>
                      <div className="meter meter-sm meter-indeterminate" />
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
                </Link>
              );
            })}

            <Link href="/essays/new" className="add-card">
              <span className="add-card-mark">
                <Icon name="plus" size={24} strokeWidth={2.4} />
              </span>
              <span className="h3">New evaluation</span>
              <span className="tiny">Paste it in — we clean the formatting</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
