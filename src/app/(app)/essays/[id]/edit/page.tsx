import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DraftEditor from "./DraftEditor";
import { getEssayBundle, getProfile, listEssays } from "@/lib/data";
import { fullEvalsUsedThisMonth, TIER } from "@/lib/quota";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function EditDraftPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ draft?: string }>;
}) {
  const { id } = await params;
  const { draft: draftId } = await searchParams;
  const [profile, items, bundle] = await Promise.all([getProfile(), listEssays(), getEssayBundle(id)]);
  if (!profile) return null;
  if (!bundle) notFound();

  const draft = draftId ? bundle.drafts.find((d) => d.id === draftId) : bundle.drafts[0];
  if (!draft) notFound();

  const used = await fullEvalsUsedThisMonth(supabaseAdmin(), profile.id);
  const evalsLeft = Math.max(0, TIER[profile.plan].evalsPerMonth - used);

  return (
    <div className="shell shell-doc">
      <Sidebar plan={profile.plan} items={items} active="essays" activeEssayId={id} />
      <main className="main">
        <DraftEditor
          essayId={id}
          draftId={draft.id}
          version={draft.version}
          initialContent={draft.content}
          evalsLeft={evalsLeft}
        />
      </main>
    </div>
  );
}
