import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getEssayBundle, getProfile, listEssays } from "@/lib/data";
import { bandFromElo } from "@/lib/engine/scale";
import EditorView from "./EditorView";

export const dynamic = "force-dynamic";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, items, bundle] = await Promise.all([
    getProfile(),
    listEssays(),
    getEssayBundle(id),
  ]);
  if (!profile) return null;
  if (!bundle) notFound();

  const { essay, drafts, evaluations } = bundle;
  const latestDraft = drafts[0];
  if (!latestDraft) notFound();

  const doneEvals = evaluations.filter((e) => e.status === "done" && e.elo != null && e.ci != null);
  const lastFull = doneEvals.find((e) => e.kind === "full") ?? null;
  const lastAny = doneEvals[0] ?? null;

  const band = (elo: number, ci: number) => {
    const b = bandFromElo(elo, ci);
    return `${b.low}–${b.high}`;
  };

  // Draft history with the band each version earned.
  const history = drafts.map((d) => {
    const ev = doneEvals.find((e) => e.draft_id === d.id);
    return { version: d.version, band: ev ? band(ev.elo!, ev.ci!) : null };
  });

  const evaluatedDraft = lastAny ? drafts.find((d) => d.id === lastAny.draft_id) : null;

  const hint =
    profile.plan === "plus" && lastFull?.result?.biggest_detractor
      ? `Biggest detractor last time: ${lastFull.result.biggest_detractor}`
      : lastAny
        ? "Your last evaluation's marks stay pinned on the Review tab while you edit."
        : "Run a full evaluation to see where this essay stands.";

  return (
    <div className="shell">
      <Sidebar plan={profile.plan} items={items} active="essays" activeEssayId={id} />
      <main className="main">
        <EditorView
          essayId={id}
          title={essay.title}
          version={latestDraft.version}
          initialContent={latestDraft.content}
          evaluatedWordCount={evaluatedDraft?.word_count ?? 0}
          lastBand={lastAny ? band(lastAny.elo!, lastAny.ci!) : null}
          hint={hint}
          history={history}
          canQuickCheck={doneEvals.length > 0}
        />
      </main>
    </div>
  );
}
