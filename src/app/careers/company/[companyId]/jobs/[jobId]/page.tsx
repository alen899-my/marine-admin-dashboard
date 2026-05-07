import { renderCompanyCareerJobDetailPage } from "@/lib/careerPortal";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Career Opportunity | Candidate Opportunities",
  description: "Review a specific job opening.",
};

interface PageProps {
  params: Promise<{ companyId: string; jobId: string }>;
}

export default async function CompanyCareerJobPage({ params }: PageProps) {
  const { companyId, jobId } = await params;

  return renderCompanyCareerJobDetailPage({ companyId, jobId });
}
