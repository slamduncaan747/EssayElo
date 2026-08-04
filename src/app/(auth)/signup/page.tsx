import AuthForm from "../AuthForm";
import { signUp } from "../actions";

export const metadata = { title: "Sign up — Margin" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return <AuthForm mode="signup" action={signUp} next={next} initialError={error} />;
}
