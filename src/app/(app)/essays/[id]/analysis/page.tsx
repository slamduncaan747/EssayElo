import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getEssayBundle, getProfile, listEssays } from "@/lib/data";
import { loadAnalysis } from "@/lib/analysis";
import { exactScore } from "@/lib/engine/scale";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analysis — Margin" };

const PROSE_TAG_COPY = {
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
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span className="mono-label">{label}</span>
      {title ? <h2 style={{ margin: 0, font: "600 17px var(--serif)" }}>{title}</h2> : null}
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
  const proseCopy = PROSE_TAG_COPY[ev.prose_tag ?? "aligned"];
  const counted = a.wins + a.losses;

  return (
    <div className="shell">
      <Sidebar plan={profile.plan} items={items} active="essays" activeEssayId={id} />
      <main className="main">
        <div className="doc-header">
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

        <div style={{ padding: "28px 44px 60px", maxWidth: 760, display: "flex", flexDirection: "column", gap: 30 }}>
          {/* Headline */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
            <span style={{ font: "600 52px/1 var(--serif)", color: "var(--accent)" }}>
              {exactScore(ev.elo!).toFixed(1)}
            </span>
            <span style={{ font: "400 13px var(--sans)", color: "var(--muted)" }}>
              ±{a.ci.toFixed(1)} after {counted} counted matchup{counted === 1 ? "" : "s"}
              {a.splits > 0 ? ` · ${a.splits} discarded as noise` : ""}
            </span>
          </div>

          {/* Composition */}
          <Section label="SCORE COMPOSITION">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { k: "Substance", v: exactScore(ev.elo!).toFixed(1), note: "what the score is" },
                { k: "Prose", v: ev.prose_score?.toFixed(1) ?? "—", note: "measured separately" },
                { k: "Structure", v: ev.structure_score?.toFixed(1) ?? "—", note: "cohesion & arc" },
              ].map((t) => (
                <div key={t.k} className="card" style={{ background: "var(--paper)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 3 }}>
                  <span className="mono-label" style={{ fontSize: 9 }}>{t.k.toUpperCase()}</span>
                  <b style={{ font: "600 24px var(--serif)", color: t.k === "Substance" ? "var(--accent)" : "var(--ink)" }}>{t.v}</b>
                  <span style={{ font: "400 10.5px var(--sans)", color: "var(--faint)" }}>{t.note}</span>
                </div>
              ))}
            </div>
            <p style={{ margin: 0, font: "400 12.5px/1.6 var(--sans)", color: "var(--muted)" }}>
              Only substance is your score. Prose and structure are measured on separate channels and
              never move it — they tell you where effort pays off.
            </p>
          </Section>

          {/* Reliance check */}
          <Section label="RELIANCE CHECK" title={proseCopy.title}>
            <p style={{ margin: 0, font: "400 13.5px/1.7 var(--sans)", color: "var(--body)" }}>
              {proseCopy.body}
            </p>
          </Section>

          {/* Match record */}
          <Section label="MATCH RECORD">
            <div style={{ display: "flex", gap: 20, alignItems: "baseline", flexWrap: "wrap" }}>
              <span style={{ font: "600 20px var(--serif)" }}>
                {a.wins}<span style={{ color: "var(--faint)" }}>W</span> · {a.losses}<span style={{ color: "var(--faint)" }}>L</span>
              </span>
              {a.strongestBeaten != null ? (
                <span style={{ font: "400 12.5px var(--sans)", color: "var(--muted)" }}>
                  strongest beaten <b style={{ color: "var(--accent)" }}>{a.strongestBeaten}</b>
                </span>
              ) : null}
              {a.weakestLostTo != null ? (
                <span style={{ font: "400 12.5px var(--sans)", color: "var(--muted)" }}>
                  weakest lost to <b style={{ color: "var(--red)" }}>{a.weakestLostTo}</b>
                </span>
              ) : null}
            </div>

            {/* Rating trajectory */}
            {a.trajectory.length > 1 ? (
              <div className="card" style={{ background: "var(--paper)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="mono-label" style={{ fontSize: 9 }}>RATING BY MATCHUP</span>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 54 }}>
                  {a.trajectory.map((s, i) => (
                    <div
                      key={i}
                      title={`after match ${i + 1}: ${s.toFixed(1)}`}
                      style={{
                        flex: 1,
                        height: `${Math.max(s, 4)}%`,
                        background: i === a.trajectory.length - 1 ? "var(--accent)" : "#d9c9b2",
                        borderRadius: "3px 3px 0 0",
                      }}
                    />
                  ))}
                </div>
                <span style={{ font: "400 10.5px var(--sans)", color: "var(--faint)" }}>
                  Converging as opponents cluster near your level.
                </span>
              </div>
            ) : null}

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {a.records.map((r) => (
                <div
                  key={r.round}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "58px 40px 1fr",
                    gap: 12,
                    alignItems: "baseline",
                    padding: "8px 10px",
                    borderBottom: "1px solid var(--border-soft)",
                    font: "400 12px var(--sans)",
                  }}
                >
                  <span
                    style={{
                      font: "600 10.5px var(--mono)",
                      color:
                        r.winner === "user"
                          ? "var(--green)"
                          : r.winner === "opponent"
                            ? "var(--red)"
                            : "var(--faint)",
                    }}
                  >
                    {r.winner === "user" ? "WON" : r.winner === "opponent" ? "LOST" : "SPLIT"}
                  </span>
                  <span style={{ font: "500 11.5px var(--mono)", color: "var(--muted)" }}>
                    {r.oppScore}
                  </span>
                  <span style={{ color: "var(--body)" }}>
                    {r.differentiator || "—"}
                    {r.offAxis ? (
                      <em style={{ color: "var(--faint)", fontSize: 11 }}> · discounted (off-axis)</em>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* Clustered evidence */}
          {a.clusters.wins.length > 0 ? (
            <Section label="WHAT'S WORKING" title="Recurring reasons you won">
              <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                {a.clusters.wins.map((w, i) => (
                  <li key={i} style={{ font: "400 13.5px/1.6 var(--sans)", color: "var(--body)" }}>{w}</li>
                ))}
              </ul>
            </Section>
          ) : null}

          {a.clusters.losses.length > 0 ? (
            <Section label="WHAT'S HOLDING IT BACK" title="Recurring reasons you lost">
              <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                {a.clusters.losses.map((l, i) => (
                  <li key={i} style={{ font: "400 13.5px/1.6 var(--sans)", color: "var(--body)" }}>{l}</li>
                ))}
              </ul>
            </Section>
          ) : null}

          {/* Producibility narrative */}
          {a.clusters.producibility.length > 0 ? (
            <Section label="HOW RARE IS YOUR MATERIAL">
              <div className="card" style={{ background: "var(--paper)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                <p style={{ margin: 0, font: "400 13.5px/1.7 var(--sans)", color: "var(--body)" }}>
                  Readers estimated that{" "}
                  <b style={{ color: "var(--accent)" }}>{a.clusters.producibility[0]}</b> other
                  applicants could reveal what your most producible beat reveals.
                </p>
                {a.clusters.metPersonMoments.length > 0 ? (
                  <p style={{ margin: 0, font: "400 13px/1.65 var(--sans)", color: "var(--muted)" }}>
                    A real person first became visible at: “{a.clusters.metPersonMoments[0]}”
                  </p>
                ) : null}
                {a.clusters.wastedOpportunities.length > 0 ? (
                  <p style={{ margin: 0, font: "400 13px/1.65 var(--sans)", color: "var(--muted)" }}>
                    Squandered chance at something rarer: {a.clusters.wastedOpportunities[0]}
                  </p>
                ) : null}
              </div>
            </Section>
          ) : null}

          {/* Ranked next steps */}
          {nextSteps.length > 0 ? (
            <Section label="NEXT STEPS" title="Ordered by estimated impact">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {nextSteps.map((m, i) => (
                  <div key={i} className="card" style={{ background: "var(--paper)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ font: "600 13px var(--sans)" }}>
                        {m.kind === "cliche" ? "Cut the cliché" : "Make it specific"}
                      </span>
                      {m.impact ? (
                        <span style={{ font: "600 11.5px var(--mono)", color: "var(--accent)", whiteSpace: "nowrap" }}>
                          {m.impact}
                        </span>
                      ) : null}
                    </div>
                    <span style={{ font: "400 12.5px/1.6 var(--serif)", color: "var(--muted)", fontStyle: "italic" }}>
                      “{m.excerpt}”
                    </span>
                    <span style={{ font: "400 12.5px/1.6 var(--sans)", color: "var(--body)" }}>{m.fix}</span>
                  </div>
                ))}
              </div>
              <Link href={`/essays/${id}/edit`} className="btn btn-accent" style={{ alignSelf: "flex-start", padding: "10px 20px", fontSize: 13 }}>
                Fix in editor
              </Link>
            </Section>
          ) : null}

          {/* Honest reliability disclosure */}
          <Section label="HOW CONFIDENT IS THIS">
            <p style={{ margin: 0, font: "400 13px/1.7 var(--sans)", color: "var(--muted)" }}>
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
