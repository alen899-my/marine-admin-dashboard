import CareerAuthCard from "@/components/Jobs/Careerauthcard";
import CareerPortalShell from "@/components/Jobs/CareerPortalShell";
import { getGlobalCareerCompanyNames } from "@/lib/careerPortal";
import PublicHeader from "@/layout/Publicheader";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Career Login | Parkora Careers",
  description: "Sign in to manage your career applications.",
};

interface CareerLoginProps {
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

export default async function CareerLogin({ searchParams }: CareerLoginProps) {
  const { redirect } = await searchParams;
  const redirectPath = getSafeRedirect(redirect);
  const companyNames = await getGlobalCareerCompanyNames();

  return (
    <>
      <PublicHeader />
      <CareerPortalShell
        title="Your Maritime Career Portal"
        description="Access your applications, review open opportunities, and keep your candidate profile ready for the next role."
        marqueeCompanyNames={companyNames}
      >
        <CareerAuthCard
          mode="login"
          redirectPath={redirectPath}
          signupPath={authPath("/careers/signup", redirectPath)}
        />
      </CareerPortalShell>
    </>
  );
}
