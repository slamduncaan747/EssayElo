import Sidebar from "@/components/Sidebar";
import { getProfile, listEssays } from "@/lib/data";
import { fullEvalsUsedThisMonth, TIER } from "@/lib/quota";
import { supabaseAdmin } from "@/lib/supabase/admin";
import SubmitForm from "./SubmitForm";

export const metadata = { title: "Score an essay — Margin" };
export const dynamic = "force-dynamic";

export default async function NewEssayPage() {
  const [profile, items] = await Promise.all([getProfile(), listEssays()]);
  if (!profile) return null;
  const limit = TIER[profile.plan].evalsPerMonth;
  const used = await fullEvalsUsedThisMonth(supabaseAdmin(), profile.id);
  const left = Math.max(0, limit - used);

  return (
    <div className="shell shell-doc">
      <Sidebar
        plan={profile.plan}
        items={items}
        active="drafts"
        evalsLeft={left}
        evalsTotal={limit}
      />
      <main className="main">
        <div className="page" style={{ flex: 1, gap: "var(--s6)" }}>
          <div className="stack g2">
            <h1 className="h1">Score an essay</h1>
            <span className="small">
              Paste it in — formatting is stripped automatically, and nothing you write is
              ever used for training.
            </span>
          </div>
          <SubmitForm evalsLeft={left} />
        </div>
      </main>
    </div>
  );
}
