import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { Metadata } from "next";
import CandidateApplicationForm from "@/components/Jobs/Application";
import PublicHeader from "@/layout/Publicheader";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  requireCareerAuth,
  fetchCareerCompany,
  getMyApplicationById,
  resolveApplicationPosition,
} from "@/lib/services/applicationService";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ company?: string }>;
}

export const metadata: Metadata = {
  title: "View Application | Candidate Portal",
};

export default async function CareerViewPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { company: companyId } = await searchParams;

  if (!id || !mongoose.isValidObjectId(id)) notFound();
  if (!companyId || !mongoose.isValidObjectId(companyId)) notFound();

  const session = await requireCareerAuth(
    `/careers/view/${id}?company=${companyId}`,
  );

  const [application, company] = await Promise.all([
    getMyApplicationById(session.user.id, id),
    fetchCareerCompany(companyId, "name logo"),
  ]);
  if (!application) notFound();

  return (
    <>
      <PublicHeader companyLogo={company.logo} />
      <div className="px-4 sm:px-6 pt-5 max-w-6xl mx-auto w-full">
        <PageBreadcrumb
          pageTitle="View Application"
          items={[{ label: "Back to Portal", href: "/careers" }]}
        />
        <CandidateApplicationForm
          companyId={companyId}
          mode="view"
          initialData={await resolveApplicationPosition(application)}
        />
      </div>
    </>
  );
}
