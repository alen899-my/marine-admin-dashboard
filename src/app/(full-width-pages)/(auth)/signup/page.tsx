import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Parkora Falcon",
  description: "Create a new account for Parkora Falcon.",
};

export default function SignUp() {
  return <SignUpForm />;
}
