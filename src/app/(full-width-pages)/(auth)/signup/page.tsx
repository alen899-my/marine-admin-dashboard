import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Parkora Falcon",
  description: "Create a new account for Parkora Falcon.",
};

interface SignUpProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function SignUp({ searchParams }: SignUpProps) {
  const { redirect } = await searchParams;

  return <SignUpForm redirect={redirect} />;
}
