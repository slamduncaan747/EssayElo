import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import EssayResult from "@/components/EssayResult";
import { getEssayBundle, getProfile, listEssays } from "@/lib/data";
import { evaluationView } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function EssayReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fresh?: string }>;
}) {
  const { id } = await params;
  const { fresh } = await searchParams;
  const [profile, items, bundle] = await Promise.all([
    getProfile(),
    listEssays(),
    getEssayBundle(id),
  ]);
  if (!profile) return null;
  if (!bundle) notFound();

  const { essay, drafts, evaluations } = bundle;
  const evaluation = evaluations.find((e) => e.status === "done") ?? null;
  if (!evaluation) notFound();

  const draft = drafts.find((d) => d.id === evaluation.draft_id) ?? drafts[0];

  return (
    <div className="shell shell-doc">
      <Sidebar plan={profile.plan} items={items} active="essays" activeEssayId={id} />
      <main className="main">
        <EssayResult
          title={essay.title}
          version={draft?.version ?? 1}
          content={draft?.content ?? ""}
          view={evaluationView(evaluation, profile.plan)}
          plan={profile.plan}
          fresh={fresh === "1"}
        />
      </main>
    </div>
  );
}
