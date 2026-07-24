import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/data";
import DevBar from "@/components/DevBar";
import { ENGINE_COOKIE, envConfig, isPreset } from "@/lib/engine/config";

/**
 * Route group for the signed-in app. Auth is enforced in middleware; this
 * layout guarantees a profile exists and mounts the testing controls.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const devTools = process.env.ALLOW_PLAN_TOGGLE === "1";
  let preset = envConfig().mock ? "mock" : "quality";
  if (devTools) {
    const c = (await cookies()).get(ENGINE_COOKIE)?.value;
    if (isPreset(c)) preset = c;
  }

  return (
    <>
      {devTools ? (
        <DevBar plan={profile.plan} preset={preset as "mock" | "fast" | "quality"} />
      ) : null}
      {children}
    </>
  );
}
