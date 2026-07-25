import Link from "next/link";
import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";
import { Rank } from "@/components/Score";
import { getEssayBundle, getProfile, listEssays } from "@/lib/data";
import { bandFromElo, eloToScore } from "@/lib/engine/scale";
import { tierForBand } from "@/lib/tier";

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
        <div className="doc-bar">
          <div className="doc-title">
            <b>{essay.title}</b>
          </div>
          <div className="tabs">
            <Link href={`/essays/${id}`}>Review</Link>
            <Link href={`/essays/${id}/edit`}>Edit</Link>
            <span className="active">History</span>
          </div>
        </div>

        <div className="page page-narrow" style={{ maxWidth: 760 }}>
          <div className="stack g2">
            <h1 className="h1">Draft history</h1>
            <span className="small">Every version of this essay, and what it scored.</span>
          </div>

          <div className="stack g4">
            {drafts.map((d) => {
              const evs = evaluations.filter((e) => e.draft_id === d.id && e.status === "done");
              return (
                <div key={d.id} className="card card-pad stack g4">
                  <div className="spread">
                    <span className="h2">Draft {d.version}</span>
                    <span className="tiny">
                      {d.word_count} words ·{" "}
                      {new Date(d.updated_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {evs.length === 0 ? (
                    <span className="tiny row g2">
                      <Icon name="clock" size={14} />
                      Not evaluated
                    </span>
                  ) : (
                    <div className="stack g2">
                      {evs.map((ev) => {
                        const b =
                          ev.elo != null && ev.ci != null ? bandFromElo(ev.elo, ev.ci) : null;
                        const tier = b ? tierForBand(b.low, b.high) : null;
                        return (
                          <div key={ev.id} className="ledger-row">
                            <span className="row g2">
                              <Icon name={ev.kind === "quick" ? "bolt" : "versus"} size={15} />
                              {ev.kind === "quick" ? "Quick check" : "Full evaluation"}
                            </span>
                            <span className="row g3">
                              {tier ? <Rank tier={tier} /> : null}
                              <b className="num" style={{ color: tier?.ink }}>
                                {b
                                  ? isPlus && ev.kind === "full"
                                    ? eloToScore(ev.elo!).toFixed(1)
                                    : `${b.low}–${b.high}`
                                  : "—"}
                              </b>
                            </span>
                          </div>
                        );
                      })}
                    </div>
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
