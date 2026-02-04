import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parkora Falcon",
  description: "Professional Dashboard",
};

export default function SignUp() {
  return <SignUpForm />;
}
