import AuthForm from "../AuthForm";
import { signIn } from "../actions";

export const metadata = { title: "Log in — Margin" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthForm mode="login" action={signIn} next={next} />;
}
