import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { Metadata } from "next";
import CrewApplicationForm from "@/components/Jobs/Application";
import PublicHeader from "@/layout/Publicheader";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  requireCareerAuth,
  fetchCareerCompany,
  getMyApplicationById,
} from "@/lib/services/applicationService";
import Job from "@/models/Job";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ company?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "View Application | Crew Portal" };
}

export default async function CareerViewPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { company: companyId } = await searchParams;

  if (!id || !mongoose.isValidObjectId(id)) notFound();
  if (!companyId || !mongoose.isValidObjectId(companyId)) notFound();

  const session = await requireCareerAuth(`/careers/view/${id}?company=${companyId}`);

  const application = await getMyApplicationById(session.user.id, id);
  if (!application) notFound();

  const company = await fetchCareerCompany(companyId, "name logo");

  const activeJobsRes = await Job.find({ companyId, status: "active", isAccepting: true })
    .select("title")
    .sort({ createdAt: -1 })
    .lean();

  const availablePositions = activeJobsRes.map((j: any) => ({
    value: j.title,
    label: j.title,
  }));

  return (
    <>
      <PublicHeader companyLogo={company.logo} />
      <div className="px-4 sm:px-6 pt-5 max-w-6xl mx-auto w-full">
        <PageBreadcrumb
          pageTitle="View Application"
          items={[{ label: "Back to Portal", href: `/careers?company=${companyId}` }]}
        />
        <CrewApplicationForm
          companyId={companyId}
          mode="view"
          initialData={application}
          availablePositions={availablePositions}
        />
      </div>
    </>
  );
}