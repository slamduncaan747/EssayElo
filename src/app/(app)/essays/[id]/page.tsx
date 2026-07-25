import { notFound, redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import EvaluatingView from "@/components/EvaluatingView";
import ReviewView from "@/components/ReviewView";
import RetryEvaluate from "@/components/RetryEvaluate";
import { getEssayBundle, getProfile, listEssays } from "@/lib/data";
import { evaluationView } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function EssayReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [profile, items, bundle] = await Promise.all([
    getProfile(),
    listEssays(),
    getEssayBundle(id),
  ]);
  if (!profile) return null;
  if (!bundle) notFound();

  const { essay, drafts, evaluations } = bundle;
  const latest = evaluations[0] ?? null;

  // A finished quick check has its own result screen.
  if (latest && latest.kind === "quick" && latest.status === "done") {
    redirect(`/essays/${id}/check/${latest.id}`);
  }

  const shell = (children: React.ReactNode) => (
    <div className="shell shell-doc">
      <Sidebar plan={profile.plan} items={items} active="essays" activeEssayId={id} />
      <main className="main">{children}</main>
    </div>
  );

  if (latest && latest.status === "running") {
    const draft = drafts.find((d) => d.id === latest.draft_id) ?? drafts[0];
    return shell(
      <EvaluatingView
        evaluationId={latest.id}
        title={essay.title}
        version={draft?.version ?? 1}
        content={draft?.content ?? ""}
        initial={{
          status: latest.status,
          phase: latest.phase,
          matches_done: latest.matches_done,
          budget: latest.budget,
        }}
      />
    );
  }

  const latestFullDone = evaluations.find((e) => e.kind === "full" && e.status === "done");
  if (!latestFullDone) {
    return shell(
      <div className="page page-narrow" style={{ maxWidth: 560 }}>
        <RetryEvaluate essayId={id} title={essay.title} />
      </div>
    );
  }

  const draft = drafts.find((d) => d.id === latestFullDone.draft_id) ?? drafts[0];
  return shell(
    <ReviewView
      essayId={id}
      title={essay.title}
      version={draft?.version ?? 1}
      content={draft?.content ?? ""}
      view={evaluationView(latestFullDone, profile.plan)}
      plan={profile.plan}
    />
  );
}
