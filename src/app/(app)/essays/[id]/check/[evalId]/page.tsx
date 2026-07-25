import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";
import { ScoreMeter, ScoreRing, TierBadge } from "@/components/Score";
import { getEssayBundle, getProfile, listEssays } from "@/lib/data";
import { bandFromElo } from "@/lib/engine/scale";
import { tierForBand, tierForScore } from "@/lib/tier";
import RunFullButton from "./RunFullButton";

export const dynamic = "force-dynamic";

/** Quick check result: the old band, struck through, next to the new one. */
export default async function QuickCheckPage({
  params,
}: {
  params: Promise<{ id: string; evalId: string }>;
}) {
  const { id, evalId } = await params;
  const [profile, items, bundle] = await Promise.all([
    getProfile(),
    listEssays(),
    getEssayBundle(id),
  ]);
  if (!profile) return null;
  if (!bundle) notFound();

  const { essay, drafts, evaluations } = bundle;
  const check = evaluations.find((e) => e.id === evalId && e.kind === "quick");
  if (!check) notFound();
  if (check.status === "running") redirect(`/essays/${id}`);
  if (check.status !== "done" || check.elo == null || check.ci == null) {
    redirect(`/essays/${id}`);
  }

  const prev = evaluations.find(
    (e) =>
      e.status === "done" &&
      e.id !== evalId &&
      e.elo != null &&
      e.ci != null &&
      new Date(e.created_at) < new Date(check.created_at)
  );

  const newBand = bandFromElo(check.elo, check.ci);
  const oldBand = prev ? bandFromElo(prev.elo!, prev.ci!) : null;
  const draft = drafts.find((d) => d.id === check.draft_id);
  const version = draft?.version ?? drafts[0]?.version ?? 1;
  const improved = oldBand ? newBand.low + newBand.high > oldBand.low + oldBand.high : true;
  const midpoint = (newBand.low + newBand.high) / 2;
  const tier = tierForBand(newBand.low, newBand.high);
  const delta = oldBand
    ? Math.round(midpoint - (oldBand.low + oldBand.high) / 2)
    : null;

  const arc = check.result?.arc ?? [];
  const counts = check.result?.counts ?? null;
  const prevCounts = prev?.result?.counts ?? null;

  return (
    <div className="shell">
      <Sidebar plan={profile.plan} items={items} active="essays" activeEssayId={id} />
      <main className="main">
        <div className="page page-narrow" style={{ maxWidth: 620 }}>
          <div className="spread">
            <div className="stack" style={{ gap: 4 }}>
              <span className="label">Quick check · draft {version}</span>
              <h1 className="h1">
                {improved ? "Your edits moved the needle" : "Close to your last draft"}
              </h1>
            </div>
            <span className="chip">{essay.title}</span>
          </div>

          <div className="card pop-in" style={{ padding: 26, display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 22,
                flexWrap: "wrap",
              }}
            >
              {oldBand ? (
                <>
                  <div className="stack center" style={{ alignItems: "center", gap: 4 }}>
                    <span
                      className="num"
                      style={{
                        font: "900 26px var(--sans)",
                        color: "var(--faint)",
                        textDecoration: "line-through",
                        textDecorationThickness: 3,
                      }}
                    >
                      {oldBand.low}–{oldBand.high}
                    </span>
                    <span className="label">Before</span>
                  </div>
                  <Icon name="arrowRight" size={22} style={{ color: "var(--faint)" }} />
                </>
              ) : null}
              <div className="stack" style={{ alignItems: "center", gap: 10 }}>
                <ScoreRing
                  value={midpoint}
                  display={`${newBand.low}–${newBand.high}`}
                  label={`draft ${version}`}
                  size={140}
                />
                <TierBadge tier={tier} />
              </div>
            </div>

            {delta != null ? (
              <div
                className="banner"
                style={{
                  justifyContent: "center",
                  background: delta >= 0 ? "var(--green-soft)" : "var(--red-soft)",
                  color: delta >= 0 ? "var(--green-ink)" : "var(--red-ink)",
                }}
              >
                {delta >= 0 ? <Icon name="arrowUp" size={18} /> : null}
                {delta >= 0 ? "+" : ""}
                {delta} points since the last evaluation
              </div>
            ) : null}

            <ScoreMeter low={newBand.low} high={newBand.high} color={tier.color} />

            {profile.plan === "plus" && check.result?.biggest_positive ? (
              <p className="copy center">
                {improved ? check.result.biggest_positive : check.result.biggest_detractor}
              </p>
            ) : null}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
              <span className="label">Essay arc</span>
              <div className="bars" style={{ height: 44 }}>
                {arc.map((v, i) => (
                  <div
                    key={i}
                    className="bar"
                    style={{ height: `${Math.max(v, 8)}%`, background: tierForScore(v).color }}
                  />
                ))}
              </div>
            </div>
            <div className="card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
              <span className="label">Marks</span>
              <div className="stack" style={{ gap: 6 }}>
                {(["cliche", "weak", "standout"] as const).map((k) => {
                  const before = prevCounts?.[k];
                  const after = counts?.[k] ?? 0;
                  const betterDown = k !== "standout";
                  const changed = before != null && before !== after;
                  const good = changed && (betterDown ? after < before! : after > before!);
                  return (
                    <div key={k} className="spread" style={{ font: "700 12.5px var(--sans)" }}>
                      <span style={{ color: "var(--muted)" }}>
                        {k === "cliche" ? "Cliché" : k[0].toUpperCase() + k.slice(1)}
                      </span>
                      <b
                        className="num"
                        style={{ color: good ? "var(--green-ink)" : "var(--text)" }}
                      >
                        {before != null ? `${before} → ${after}` : after}
                      </b>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="stack" style={{ gap: 10 }}>
            <RunFullButton essayId={id} />
            <Link href={`/essays/${id}/edit`} className="btn btn-ghost" style={{ alignSelf: "center" }}>
              Keep editing
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
