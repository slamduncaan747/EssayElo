import { redirect } from "next/navigation";
import AuthForm from "../AuthForm";
import { updatePassword } from "../actions";
import { currentUser } from "@/lib/supabase/server";

export const metadata = { title: "Choose a new password — Margin" };
export const dynamic = "force-dynamic";

/**
 * Reached from a recovery link, which signs the user in specifically so they
 * can set a new password. No session means the link expired or was already
 * used — send them back to request a fresh one rather than showing a form
 * that cannot possibly submit.
 */
export default async function ResetPasswordPage() {
  const user = await currentUser();
  if (!user) {
    redirect("/forgot-password?error=" + encodeURIComponent("That reset link has expired. Request a new one."));
  }
  return <AuthForm mode="reset" action={updatePassword} />;
}
