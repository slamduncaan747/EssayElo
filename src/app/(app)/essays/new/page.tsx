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
  const used = await fullEvalsUsedThisMonth(supabaseAdmin(), profile.id);
  const left = Math.max(0, TIER[profile.plan].evalsPerMonth - used);

  return (
    <div className="shell">
      <Sidebar plan={profile.plan} items={items} active="drafts" />
      <main className="main" style={{ padding: "32px 48px", gap: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ font: "600 22px var(--serif)" }}>Score an essay</span>
          <span style={{ font: "400 13px var(--sans)", color: "var(--muted)" }}>
            Paste it in — formatting is stripped automatically.
          </span>
        </div>
        <SubmitForm evalsLeft={left} />
      </main>
    </div>
  );
}
