import CareerAuthCard from "@/components/Jobs/Careerauthcard";
import CareerPortalShell from "@/components/Jobs/CareerPortalShell";
import { getGlobalCareerCompanyNames } from "@/lib/careerPortal";
import PublicHeader from "@/layout/Publicheader";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Career Sign Up | Parkora Careers",
  description: "Create a candidate account for career applications.",
};

interface CareerSignupProps {
  searchParams: Promise<{ redirect?: string }>;
}

function getSafeRedirect(redirect?: string) {
  return redirect?.startsWith("/") && !redirect.startsWith("//")
    ? redirect
    : "/careers";
}

function authPath(path: "/careers/login" | "/careers/signup", redirectPath: string) {
  return `${path}?redirect=${encodeURIComponent(redirectPath)}`;
}

export default async function CareerSignup({ searchParams }: CareerSignupProps) {
  const { redirect } = await searchParams;
  const redirectPath = getSafeRedirect(redirect);
  const companyNames = await getGlobalCareerCompanyNames();

  return (
    <>
      <PublicHeader />
      <CareerPortalShell
        title="Start Your Maritime Career"
        description="Create one candidate account to apply across active company openings and manage your applications in one place."
        marqueeCompanyNames={companyNames}
      >
        <CareerAuthCard
          mode="signup"
          redirectPath={redirectPath}
          loginPath={authPath("/careers/login", redirectPath)}
        />
      </CareerPortalShell>
    </>
  );
}
