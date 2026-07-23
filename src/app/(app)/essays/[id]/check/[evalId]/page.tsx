import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getEssayBundle, getProfile, listEssays } from "@/lib/data";
import { bandFromElo } from "@/lib/engine/scale";
import RunFullButton from "./RunFullButton";

export const dynamic = "force-dynamic";

/** Quick check result — design 11g: old band struck through → new band. */
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

  const arc = check.result?.arc ?? [];
  const counts = check.result?.counts ?? null;
  const prevCounts = prev?.result?.counts ?? null;

  return (
    <div className="shell">
      <Sidebar plan={profile.plan} items={items} active="essays" activeEssayId={id} />
      <main className="main" style={{ alignItems: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="mono-label">QUICK CHECK · DRAFT {version}</span>
              <span style={{ font: "italic 500 19px var(--serif)" }}>
                {improved ? "Your edits moved the needle" : "This draft lands close to the last one"}
              </span>
            </div>
            <span className="chip">{essay.title}</span>
          </div>

          <div className="card" style={{ background: "var(--paper)", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
              {oldBand ? (
                <>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span
                      style={{
                        font: "600 30px var(--serif)",
                        color: "var(--faint)",
                        textDecoration: "line-through",
                        textDecorationThickness: 2,
                        textDecorationColor: "rgba(138,77,46,.4)",
                      }}
                    >
                      {oldBand.low}–{oldBand.high}
                    </span>
                    <span style={{ font: "500 10px var(--mono)", color: "var(--faint)" }}>BEFORE</span>
                  </div>
                  <span style={{ font: "400 22px var(--serif)", color: "var(--accent)" }}>→</span>
                </>
              ) : null}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ font: "600 44px var(--serif)", color: "var(--accent)" }}>
                  {newBand.low}–{newBand.high}
                </span>
                <span style={{ font: "500 10px var(--mono)", color: "var(--accent)" }}>DRAFT {version}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div className="track track-light">
                {oldBand ? (
                  <div
                    className="track-fill"
                    style={{
                      left: `${oldBand.low}%`,
                      width: `${Math.max(oldBand.high - oldBand.low, 2)}%`,
                      background: "#c9c2b2",
                    }}
                  />
                ) : null}
                <div
                  className="track-fill"
                  style={{
                    left: `${newBand.low}%`,
                    width: `${Math.max(newBand.high - newBand.low, 2)}%`,
                    boxShadow: "0 0 0 2px var(--paper)",
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", font: "400 10px var(--mono)", color: "var(--faint)" }}>
                <span>0</span>
                <span>100</span>
              </div>
            </div>

            {profile.plan === "plus" && check.result?.biggest_positive ? (
              <div style={{ font: "400 12.5px/1.55 var(--sans)", color: "var(--body)", textAlign: "center" }}>
                {improved ? check.result.biggest_positive : check.result.biggest_detractor}
              </div>
            ) : null}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="card" style={{ background: "var(--paper)", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
              <span className="mono-label" style={{ letterSpacing: ".1em" }}>ESSAY ARC</span>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 36 }}>
                {arc.map((v, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${Math.max(v, 6)}%`,
                      borderRadius: "2px 2px 0 0",
                      background: v < 40 ? "var(--red)" : v < 65 ? "rgba(201,162,90,.7)" : "var(--gold)",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="card" style={{ background: "var(--paper)", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="mono-label" style={{ letterSpacing: ".1em" }}>MARKS</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, font: "400 11.5px var(--sans)", color: "var(--body)" }}>
                {(["cliche", "weak", "standout"] as const).map((k) => {
                  const before = prevCounts?.[k];
                  const after = counts?.[k] ?? 0;
                  const betterDown = k !== "standout";
                  const changed = before != null && before !== after;
                  const good = changed && (betterDown ? after < before! : after > before!);
                  return (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{k === "cliche" ? "Cliché" : k[0].toUpperCase() + k.slice(1)}</span>
                      <span style={{ fontWeight: 600, color: good ? "var(--green)" : "inherit" }}>
                        {before != null ? `${before} → ${after}` : after}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <RunFullButton essayId={id} />
            <Link
              href={`/essays/${id}/edit`}
              style={{ textAlign: "center", font: "500 12px var(--sans)", color: "var(--accent)" }}
            >
              Keep editing
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
