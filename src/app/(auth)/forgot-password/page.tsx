import AuthForm from "../AuthForm";
import { requestPasswordReset } from "../actions";

export const metadata = { title: "Reset your password — Margin" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <AuthForm mode="forgot" action={requestPasswordReset} initialError={error} />;
}
