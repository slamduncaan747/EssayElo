import Link from "next/link";
import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getEssayBundle, getProfile, listEssays } from "@/lib/data";
import { bandFromElo, eloToScore } from "@/lib/engine/scale";

export const dynamic = "force-dynamic";

export default async function HistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, items, bundle] = await Promise.all([
    getProfile(),
    listEssays(),
    getEssayBundle(id),
  ]);
  if (!profile) return null;
  if (!bundle) notFound();
  const { essay, drafts, evaluations } = bundle;
  const isPlus = profile.plan === "plus";

  return (
    <div className="shell">
      <Sidebar plan={profile.plan} items={items} active="essays" activeEssayId={id} />
      <main className="main">
        <div className="doc-header">
          <div className="doc-title">
            <b>{essay.title}</b>
          </div>
          <div className="tabs">
            <Link href={`/essays/${id}`}>Review</Link>
            <Link href={`/essays/${id}/edit`}>Edit</Link>
            <span className="active">History</span>
          </div>
        </div>
        <div style={{ padding: "30px 44px", maxWidth: 640 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {drafts.map((d) => {
              const evs = evaluations.filter((e) => e.draft_id === d.id && e.status === "done");
              return (
                <div key={d.id} className="card" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ font: "600 14px var(--serif)" }}>Draft {d.version}</span>
                    <span style={{ font: "400 11px var(--sans)", color: "var(--faint)" }}>
                      {d.word_count} words ·{" "}
                      {new Date(d.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  {evs.length === 0 ? (
                    <span style={{ font: "400 12px var(--sans)", color: "var(--faint)" }}>Not evaluated</span>
                  ) : (
                    evs.map((ev) => {
                      const b = ev.elo != null && ev.ci != null ? bandFromElo(ev.elo, ev.ci) : null;
                      return (
                        <div
                          key={ev.id}
                          style={{ display: "flex", justifyContent: "space-between", font: "400 12.5px var(--sans)", color: "var(--muted)" }}
                        >
                          <span>{ev.kind === "quick" ? "Quick check" : "Full evaluation"}</span>
                          <b style={{ color: "var(--accent)" }}>
                            {b
                              ? isPlus && ev.kind === "full"
                                ? eloToScore(ev.elo!).toFixed(1)
                                : `${b.low}–${b.high}`
                              : "—"}
                          </b>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
