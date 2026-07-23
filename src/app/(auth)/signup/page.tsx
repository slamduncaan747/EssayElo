import AuthForm from "../AuthForm";
import { signUp } from "../actions";

export const metadata = { title: "Sign up — Margin" };

export default function SignupPage() {
  return <AuthForm mode="signup" action={signUp} />;
}
