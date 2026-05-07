import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Parkora Falcon",
  description: "Sign in to your Parkora Falcon account.",
};

interface SignInProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function SignIn({ searchParams }: SignInProps) {
  const { redirect } = await searchParams;

  return <SignInForm redirect={redirect} />;
}
