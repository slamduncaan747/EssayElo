import { redirect } from "next/navigation";
import { getProfile } from "@/lib/data";
import PlanToggle from "@/components/PlanToggle";

/**
 * Route group for the signed-in app. Auth is enforced in middleware; this
 * layout just guarantees a profile exists for children via context-free
 * re-fetching (each page loads what it needs — pages are cheap RLS reads).
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return (
    <>
      {process.env.ALLOW_PLAN_TOGGLE === "1" ? <PlanToggle plan={profile.plan} /> : null}
      {children}
    </>
  );
}
