import { renderCompanyCareersPage } from "@/lib/careerPortal";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company Careers | Candidate Opportunities",
  description: "Browse jobs for a specific company.",
};

interface PageProps {
  params: Promise<{ companyId: string }>;
}

export default async function CompanyCareersPage({ params }: PageProps) {
  const { companyId } = await params;

  return renderCompanyCareersPage({ companyId });
}
