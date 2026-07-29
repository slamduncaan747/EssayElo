import { redirect } from "next/navigation";
import { getProfile } from "@/lib/data";
import PlanSwitch from "@/components/PlanSwitch";

/**
 * Route group for the signed-in app. Auth is enforced in middleware; this
 * layout guarantees a profile exists and mounts the dev plan switch.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  return (
    <>
      <PlanSwitch plan={profile.plan} />
      {children}
    </>
  );
}
