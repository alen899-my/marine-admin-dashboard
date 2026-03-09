import { auth } from "@/auth";
import { redirect } from "next/navigation";
import mongoose from "mongoose";
import Error404 from "@/app/(full-width-pages)/(error-pages)/error-404/page";
import CrewApplicationForm from "@/components/Jobs/Application";
import PublicHeader from "@/layout/Publicheader";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  requireCareerAuth,
  fetchCareerCompany,
} from "@/lib/services/applicationService";
import Job from "@/models/Job";

interface PageProps {
  searchParams: Promise<{ company?: string; jobId?: string }>;
}

export default async function ApplyPage({ searchParams }: PageProps) {
  const { company: companyId, jobId } = await searchParams;

  if (!companyId || !mongoose.isValidObjectId(companyId)) return <Error404 />;

  await requireCareerAuth(`/careers/apply?company=${companyId}`);

  const company = JSON.parse(
    JSON.stringify(
      await fetchCareerCompany(companyId, "name logo"),
    ),
  );


  const activeJobsRes = await Job.find({ companyId, status: "active", isAccepting: true })
    .select("title")
    .sort({ createdAt: -1 })
    .lean();

  const availablePositions = activeJobsRes.map((j: any) => ({
    value: j.title,
    label: j.title,
  }));

  let initialPosition = "";
  if (jobId && mongoose.isValidObjectId(jobId)) {
    const job = await Job.findById(jobId).select("title").lean();
    if (job) initialPosition = job.title;
  }

  return (
    <>
      <PublicHeader companyLogo={company.logo} />
      <div className="px-4 sm:px-6 pt-5 max-w-7xl mx-auto w-full">
        <PageBreadcrumb
          pageTitle="Crew Application"
          items={[{ label: "Back to portal", href: `/careers?company=${companyId}` }]}
        />

        <CrewApplicationForm
          companyId={company._id}
          companyName={company.name}
          companyLogo={company.logo}
          mode="create"
          isPublic={true}
          availablePositions={availablePositions}
          initialPosition={initialPosition}
        />
      </div>
    </>
  );
}