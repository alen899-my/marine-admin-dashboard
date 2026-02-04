import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Parkora Falcon",
  description: "Sign in to your Parkora Falcon account.",
};

export default function SignIn() {
  return <SignInForm />;
}
