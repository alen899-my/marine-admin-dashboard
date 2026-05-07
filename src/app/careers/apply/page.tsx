import mongoose from "mongoose";
import Error404 from "@/app/(full-width-pages)/(error-pages)/error-404/page";
import CandidateApplicationForm from "@/components/Jobs/Application";
import ApplicationsClosed from "@/components/Jobs/ApplicationsClosed";
import PublicHeader from "@/layout/Publicheader";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  requireCareerAuth,
  fetchCareerCompany,
  getMyApplications,
  getMyApplicationById,
  getLastApplicationByUser,
  fetchActiveJobPositions,
} from "@/lib/services/applicationService";
import Job from "@/models/Job";
import { dbConnect } from "@/lib/db";

interface PageProps {
  searchParams: Promise<{ company?: string; jobId?: string }>;
}

export default async function ApplyPage({ searchParams }: PageProps) {
  const { company: companyId, jobId } = await searchParams;

  if (!companyId || !mongoose.isValidObjectId(companyId)) return <Error404 />;

  const redirectPath = `/careers/apply?company=${companyId}${
    jobId ? `&jobId=${jobId}` : ""
  }`;
  const session = await requireCareerAuth(
    redirectPath,
  );
  await dbConnect();

  const [company, availablePositions, myApplications] = await Promise.all([
    fetchCareerCompany(companyId, "name logo").then((c) =>
      JSON.parse(JSON.stringify(c)),
    ),
    fetchActiveJobPositions(companyId),
    getMyApplications(session.user.id, companyId, jobId),
  ]);

  const [initialPosition, existingApplication] = await Promise.all([
    jobId && mongoose.isValidObjectId(jobId)
      ? Job.findById(jobId)
          .select("_id")
          .lean()
          .then((j) => (j as any)?._id.toString() ?? "")
      : Promise.resolve(""),
    myApplications.length > 0
      ? getMyApplicationById(session.user.id, myApplications[0]._id)
      : Promise.resolve(null),
  ]);

  // ── Block rejected applicants from re-applying ─────────────────────────────
  if (existingApplication?.status === "rejected") {
    return (
      <>
        <PublicHeader companyLogo={company.logo} />
        <ApplicationsClosed
          logo={company.logo}
          name={company.name}
          message="Your application for this position was not successful. You are not eligible to re-apply for this job."
        />
      </>
    );
  }

  const hasPreviousApplication = !existingApplication
    ? !!(await getLastApplicationByUser(session.user.id))
    : false;

  return (
    <>
      <PublicHeader companyLogo={company.logo} />
      <div className="px-4 sm:px-6 pt-5 max-w-7xl mx-auto w-full">
        <PageBreadcrumb
          pageTitle="Candidate Application"
          items={[{ label: "Back to Portal", href: "/careers" }]}
        />
        <CandidateApplicationForm
          companyId={company._id}
          companyName={company.name}
          companyLogo={company.logo}
          mode={existingApplication ? "edit" : "create"}
          isPublic={true}
          availablePositions={availablePositions}
          initialPosition={initialPosition}
          jobId={jobId}
          applicationId={existingApplication?._id}
          initialData={existingApplication ?? undefined}
          hasPreviousApplication={hasPreviousApplication}
        />
      </div>
    </>
  );
}
