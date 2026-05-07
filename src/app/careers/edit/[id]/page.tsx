import { redirect, notFound } from "next/navigation";
import mongoose from "mongoose";
import { Metadata } from "next";
import CandidateApplicationForm from "@/components/Jobs/Application";
import PublicHeader from "@/layout/Publicheader";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  requireCareerAuth,
  fetchCareerCompany,
  getMyApplicationById,
  fetchActiveJobPositions,
} from "@/lib/services/applicationService";
import {
  canEditPublicApplication,
  canEditPublicApplicationStatus,
} from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ company?: string }>;
}

export const metadata: Metadata = {
  title: "Edit Application | Candidate Portal",
};

export default async function CareerEditPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { company: companyId } = await searchParams;

  if (!id || !mongoose.isValidObjectId(id)) notFound();
  if (!companyId || !mongoose.isValidObjectId(companyId)) notFound();

  const session = await requireCareerAuth(
    `/careers/edit/${id}?company=${companyId}`,
  );

  const [application, company, availablePositions] = await Promise.all([
    getMyApplicationById(session.user.id, id),
    fetchCareerCompany(companyId, "name logo"),
    fetchActiveJobPositions(companyId),
  ]);
  if (!application) notFound();

  const canEdit =
    canEditPublicApplicationStatus(application.status) &&
    canEditPublicApplication({
      jobIsAccepting: application.jobIsAccepting,
      deadline: application.deadline,
    });

  if (!canEdit) {
    redirect(`/careers/view/${id}?company=${companyId}`);
  }

  return (
    <>
      <PublicHeader companyLogo={company.logo} />
      <div className="px-4 sm:px-6 pt-5 max-w-7xl mx-auto w-full">
        <PageBreadcrumb
          pageTitle="Edit Application"
          items={[{ label: "Back to Portal", href: "/careers" }]}
        />
        <CandidateApplicationForm
          companyId={companyId}
          companyName={company.name}
          companyLogo={company.logo}
          mode="edit"
          isPublic={true}
          initialData={application}
          applicationId={id}
          availablePositions={availablePositions}
          jobId={application.jobId?.toString()}
        />
      </div>
    </>
  );
}
