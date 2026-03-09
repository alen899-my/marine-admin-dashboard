import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";
import Error404 from "@/app/(full-width-pages)/(error-pages)/error-404/page"
export const metadata: Metadata = {
  title: "Sign Up | Parkora Falcon",
  description: "Create a new account for Parkora Falcon.",
};

export default function SignUp() {
  return <SignUpForm/>;
}
