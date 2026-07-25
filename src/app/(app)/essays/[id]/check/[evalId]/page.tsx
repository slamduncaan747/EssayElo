import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";
import { Medal, Rank, ScoreMeter, ScoreRing } from "@/components/Score";
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

  const now = bandFromElo(check.elo, check.ci);
  const before = prev ? bandFromElo(prev.elo!, prev.ci!) : null;
  const draft = drafts.find((d) => d.id === check.draft_id);
  const version = draft?.version ?? drafts[0]?.version ?? 1;
  const mid = (now.low + now.high) / 2;
  const tier = tierForBand(now.low, now.high);
  const delta = before ? Math.round(mid - (before.low + before.high) / 2) : null;
  const improved = delta == null ? true : delta >= 0;

  const arc = check.result?.arc ?? [];
  const counts = check.result?.counts ?? null;
  const prevCounts = prev?.result?.counts ?? null;

  return (
    <div className="shell">
      <Sidebar plan={profile.plan} items={items} active="essays" activeEssayId={id} />
      <main className="main">
        <div className="page page-narrow" style={{ maxWidth: 640, gap: "var(--s5)" }}>
          <div className="stack g2">
            <span className="label">Quick check · draft {version}</span>
            <h1 className="h1">
              {improved ? "Your edits moved the needle" : "Close to your last draft"}
            </h1>
            <span className="small">{essay.title}</span>
          </div>

          <div className="card card-pad stack g6 pop-in" style={{ alignItems: "center" }}>
            <div className="row wrap g6" style={{ justifyContent: "center" }}>
              {before ? (
                <>
                  <div className="stack g2" style={{ alignItems: "center" }}>
                    <Medal
                      value={(before.low + before.high) / 2}
                      display={`${before.low}–${before.high}`}
                      size={54}
                    />
                    <span className="label">Before</span>
                  </div>
                  <Icon name="arrowRight" size={22} style={{ color: "var(--text-4)" }} />
                </>
              ) : null}
              <div className="stack g3" style={{ alignItems: "center" }}>
                <ScoreRing
                  value={mid}
                  display={`${now.low}–${now.high}`}
                  label={`draft ${version}`}
                  size={148}
                />
                <Rank tier={tier} size="lg" />
              </div>
            </div>

            {delta != null ? (
              <div
                className="banner"
                style={{
                  justifyContent: "center",
                  width: "100%",
                  background: improved ? "var(--green-50)" : "var(--red-50)",
                  border: `1.5px solid ${improved ? "var(--green-100)" : "var(--red-100)"}`,
                  color: improved ? "var(--green-ink)" : "var(--red-ink)",
                }}
              >
                {improved ? <Icon name="arrowUp" size={18} /> : null}
                {delta >= 0 ? "+" : ""}
                {delta} points since your last evaluation
              </div>
            ) : null}

            <ScoreMeter low={now.low} high={now.high} color={tier.color} />

            {profile.plan === "plus" && check.result?.biggest_positive ? (
              <p className="copy center">
                {improved ? check.result.biggest_positive : check.result.biggest_detractor}
              </p>
            ) : null}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s4)" }}>
            <div className="card card-pad stack g3">
              <span className="label">Essay arc</span>
              <div className="bars" style={{ height: 52 }}>
                {arc.map((v, i) => (
                  <div
                    key={i}
                    className="bar"
                    title={`¶${i + 1}`}
                    style={{ height: `${Math.max(v, 8)}%`, background: tierForScore(v).color }}
                  />
                ))}
              </div>
            </div>
            <div className="card card-pad stack g3">
              <span className="label">Marks</span>
              <div className="stack g2">
                {(["cliche", "weak", "standout"] as const).map((k) => {
                  const was = prevCounts?.[k];
                  const is = counts?.[k] ?? 0;
                  const betterDown = k !== "standout";
                  const changed = was != null && was !== is;
                  const good = changed && (betterDown ? is < was! : is > was!);
                  return (
                    <div key={k} className="spread" style={{ fontSize: 13, fontWeight: 700 }}>
                      <span style={{ color: "var(--text-3)" }}>
                        {k === "cliche" ? "Cliché" : k[0].toUpperCase() + k.slice(1)}
                      </span>
                      <b className="num" style={{ color: good ? "var(--green-ink)" : "var(--text)" }}>
                        {was != null ? `${was} → ${is}` : is}
                      </b>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="stack g3">
            <RunFullButton essayId={id} />
            <Link href={`/essays/${id}/edit`} className="btn btn-quiet" style={{ alignSelf: "center" }}>
              Keep editing
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
