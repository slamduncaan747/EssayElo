import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";
import { NextRank, Rank, ScoreRing } from "@/components/Score";
import { getEssayBundle, getProfile, listEssays } from "@/lib/data";
import { loadAnalysis } from "@/lib/analysis";
import { exactScore } from "@/lib/engine/scale";
import { tierForScore } from "@/lib/tier";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analysis — Margin" };

const PROSE_COPY = {
  carrying: {
    title: "Prose is carrying it",
    body: "Your writing sits well above the substance of essays scoring near you. The essay reads better than it is — which makes it fragile against a reader who sees through polish. Effort spent on more sentences has low upside; effort spent finding rarer material has high upside.",
  },
  substance_ahead: {
    title: "Substance ahead of prose",
    body: "You have rarer material than essays scoring near you, told less well. This is the high-leverage position: craft revision has real upside here, because the underlying revelation is already doing work.",
  },
  aligned: {
    title: "Prose and substance aligned",
    body: "Your writing quality matches the substance of essays scoring near you. Neither is holding the other back — gains will come from finding a rarer revelation, not from polishing.",
  },
} as const;

function Section({
  label,
  title,
  children,
}: {
  label: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="stack g4">
      <span className="label">{label}</span>
      {title ? <h2 className="h2">{title}</h2> : null}
      {children}
    </section>
  );
}

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, items, bundle] = await Promise.all([
    getProfile(),
    listEssays(),
    getEssayBundle(id),
  ]);
  if (!profile) return null;
  if (!bundle) notFound();
  if (profile.plan !== "plus") redirect("/upgrade");

  const { essay, evaluations } = bundle;
  const ev = evaluations.find((e) => e.kind === "full" && e.status === "done");
  if (!ev) redirect(`/essays/${id}`);

  const a = await loadAnalysis(ev);
  if (!a) redirect(`/essays/${id}`);

  const marks = ev.result?.marks ?? [];
  const nextSteps = marks
    .filter((m) => (m.kind === "cliche" || m.kind === "weak") && m.fix)
    .slice(0, 5);
  const prose = PROSE_COPY[ev.prose_tag ?? "aligned"];
  const counted = a.wins + a.losses;
  const score = exactScore(ev.elo!);
  const tier = tierForScore(score);

  return (
    <div className="shell">
      <Sidebar plan={profile.plan} items={items} active="essays" activeEssayId={id} />
      <main className="main">
        <div className="doc-bar">
          <div className="doc-title">
            <b>{essay.title}</b>
            <span className="chip">Draft {bundle.drafts[0]?.version ?? 1}</span>
          </div>
          <div className="tabs">
            <Link href={`/essays/${id}`}>Review</Link>
            <Link href={`/essays/${id}/edit`}>Edit</Link>
            <span className="active">Analysis</span>
          </div>
        </div>

        <div className="page page-narrow" style={{ maxWidth: 860 }}>
          {/* Headline */}
          <div className="card card-pad row wrap g7">
            <ScoreRing value={score} display={score.toFixed(1)} label="out of 100" size={136} />
            <div className="stack g4 grow" style={{ minWidth: 230 }}>
              <Rank tier={tier} size="lg" />
              <span className="small">
                ±{a.ci.toFixed(1)} after {counted} counted matchup{counted === 1 ? "" : "s"}
                {a.splits > 0 ? ` · ${a.splits} discarded as noise` : ""}
              </span>
              <NextRank score={score} />
            </div>
          </div>

          <Section label="Score composition">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "var(--s4)" }}>
              {[
                { k: "Substance", v: score.toFixed(1), note: "this is your score", lead: true },
                { k: "Prose", v: ev.prose_score?.toFixed(1) ?? "—", note: "measured separately" },
                { k: "Structure", v: ev.structure_score?.toFixed(1) ?? "—", note: "cohesion & arc" },
              ].map((t) => (
                <div key={t.k} className="card stack g2" style={{ padding: "var(--s5)" }}>
                  <span className="label">{t.k}</span>
                  <b
                    className="num"
                    style={{
                      fontSize: 28,
                      fontWeight: 900,
                      color: t.lead ? tier.ink : "var(--text)",
                      lineHeight: 1.1,
                    }}
                  >
                    {t.v}
                  </b>
                  <span className="tiny">{t.note}</span>
                </div>
              ))}
            </div>
            <p className="small">
              Only substance is your score. Prose and structure are measured on separate
              channels and never move it — they tell you where effort pays off.
            </p>
          </Section>

          <Section label="Reliance check" title={prose.title}>
            <p className="copy">{prose.body}</p>
          </Section>

          <Section label="Match record">
            <div className="stats">
              <div className="stat">
                <span className="stat-icon" style={{ background: "var(--green-50)", color: "var(--green-ink)" }}>
                  <Icon name="check" size={21} strokeWidth={2.6} />
                </span>
                <div>
                  <b>{a.wins}</b>
                  <span>Won</span>
                </div>
              </div>
              <div className="stat">
                <span className="stat-icon" style={{ background: "var(--red-50)", color: "var(--red-ink)" }}>
                  <Icon name="cross" size={21} strokeWidth={2.6} />
                </span>
                <div>
                  <b>{a.losses}</b>
                  <span>Lost</span>
                </div>
              </div>
              {a.strongestBeaten != null ? (
                <div className="stat">
                  <span className="stat-icon" style={{ background: "var(--gold-50)", color: "var(--gold-press)" }}>
                    <Icon name="trophy" size={21} />
                  </span>
                  <div>
                    <b>{a.strongestBeaten}</b>
                    <span>Best win</span>
                  </div>
                </div>
              ) : null}
              {a.weakestLostTo != null ? (
                <div className="stat">
                  <span className="stat-icon" style={{ background: "var(--sunken)", color: "var(--text-3)" }}>
                    <Icon name="flag" size={21} />
                  </span>
                  <div>
                    <b>{a.weakestLostTo}</b>
                    <span>Worst loss</span>
                  </div>
                </div>
              ) : null}
            </div>

            {a.trajectory.length > 1 ? (
              /* Ratings move over a narrow band, so plotting them against an
                 absolute 0–100 axis renders a flat wall. Scale to the run's own
                 range and label the endpoints so it stays honest. */
              (() => {
                const lo = Math.min(...a.trajectory);
                const hi = Math.max(...a.trajectory);
                const span = hi - lo || 1;
                return (
                  <div className="card card-pad stack g3">
                    <div className="spread">
                      <span className="label">Rating by matchup</span>
                      <span className="tiny num">
                        {lo.toFixed(1)} → {hi.toFixed(1)}
                      </span>
                    </div>
                    <div className="bars" style={{ height: 84 }}>
                      {a.trajectory.map((s, i) => (
                        <div
                          key={i}
                          className="bar"
                          title={`after match ${i + 1}: ${s.toFixed(1)}`}
                          style={{
                            height: `${18 + ((s - lo) / span) * 82}%`,
                            background:
                              i === a.trajectory.length - 1 ? tier.color : "var(--n-200)",
                          }}
                        />
                      ))}
                    </div>
                    <span className="tiny">
                      Scaled to this run&rsquo;s range · converging as opponents cluster near
                      your level.
                    </span>
                  </div>
                );
              })()
            ) : null}

            <div className="stack g2">
              {a.records.map((r) => (
                <div key={r.round} className="record">
                  <span
                    className="record-flag"
                    style={{
                      background:
                        r.winner === "user"
                          ? "var(--green-50)"
                          : r.winner === "opponent"
                            ? "var(--red-50)"
                            : "var(--sunken)",
                      color:
                        r.winner === "user"
                          ? "var(--green-ink)"
                          : r.winner === "opponent"
                            ? "var(--red-ink)"
                            : "var(--text-3)",
                    }}
                  >
                    {r.winner === "user" ? "WON" : r.winner === "opponent" ? "LOST" : "SPLIT"}
                  </span>
                  <span className="num" style={{ color: "var(--text-3)", fontWeight: 800 }}>
                    {r.oppScore}
                  </span>
                  <span>
                    {r.differentiator || "—"}
                    {r.offAxis ? (
                      <em style={{ color: "var(--text-4)" }}> · discounted (off-axis)</em>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {a.clusters.wins.length > 0 ? (
            <Section label="What's working" title="Recurring reasons you won">
              <div className="stack g3">
                {a.clusters.wins.map((w, i) => (
                  <div key={i} className="feat">
                    <Icon name="check" size={18} strokeWidth={2.6} style={{ color: "var(--green)" }} />
                    {w}
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {a.clusters.losses.length > 0 ? (
            <Section label="What's holding it back" title="Recurring reasons you lost">
              <div className="stack g3">
                {a.clusters.losses.map((l, i) => (
                  <div key={i} className="feat">
                    <Icon name="flag" size={18} strokeWidth={2.4} style={{ color: "var(--red)" }} />
                    {l}
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {a.clusters.producibility.length > 0 ? (
            <Section label="How rare is your material">
              <div className="card card-pad stack g3">
                <p className="copy">
                  Readers estimated that{" "}
                  <b style={{ color: "var(--brand)" }}>{a.clusters.producibility[0]}</b> other
                  applicants could reveal what your most producible beat reveals.
                </p>
                {a.clusters.metPersonMoments.length > 0 ? (
                  <p className="small">
                    A real person first became visible at: &ldquo;
                    {a.clusters.metPersonMoments[0]}&rdquo;
                  </p>
                ) : null}
                {a.clusters.wastedOpportunities.length > 0 ? (
                  <p className="small">
                    Squandered chance at something rarer: {a.clusters.wastedOpportunities[0]}
                  </p>
                ) : null}
              </div>
            </Section>
          ) : null}

          {nextSteps.length > 0 ? (
            <Section label="Next steps" title="Ordered by estimated impact">
              <div className="stack g3">
                {nextSteps.map((m, i) => (
                  <div key={i} className="card card-pad" style={{ display: "flex", gap: "var(--s4)" }}>
                    <span
                      className="note-badge"
                      style={{
                        background: m.kind === "cliche" ? "var(--red)" : "var(--gold-press)",
                        color: "#fff",
                        marginTop: 2,
                      }}
                    >
                      {i + 1}
                    </span>
                    <div className="stack g3">
                      <div className="spread">
                        <span className="h3">
                          {m.kind === "cliche" ? "Cut the cliché" : "Make it specific"}
                        </span>
                        {m.impact ? <span className="chip chip-brand num">{m.impact}</span> : null}
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--serif)",
                          fontSize: 14.5,
                          lineHeight: 1.6,
                          color: "var(--text-3)",
                          fontStyle: "italic",
                        }}
                      >
                        &ldquo;{m.excerpt}&rdquo;
                      </span>
                      <span className="copy">{m.fix}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href={`/essays/${id}/edit`}
                className="btn btn-primary"
                style={{ alignSelf: "flex-start" }}
              >
                <Icon name="pencil" size={16} />
                Fix in editor
              </Link>
            </Section>
          ) : null}

          <Section label="How confident is this">
            <p className="small">
              {counted} matchup{counted === 1 ? "" : "s"} counted toward this rating
              {a.splits > 0
                ? `, and ${a.splits} discarded because reversing the presentation order flipped the winner — pure noise.`
                : ", with no order-swap disagreements."}{" "}
              {a.discounted > 0
                ? `${a.discounted} were down-weighted because the stated reason drifted off the producibility axis. `
                : ""}
              {a.intransitivity > 0.15
                ? "Readers disagreed about this essay more than usual — results were inconsistent across opponents, so the interval is wider."
                : "Results were consistent across opponents."}
            </p>
          </Section>
        </div>
      </main>
    </div>
  );
}
