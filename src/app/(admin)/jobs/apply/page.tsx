import { auth } from "@/auth";
import { redirect } from "next/navigation";
import mongoose from "mongoose";
import CrewApplicationForm from "@/components/Jobs/Application";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";
import Job from "@/models/Job";

export default async function NewApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const { jobId } = await searchParams;
  const session = await auth();

  // Guard: Ensure user is logged in
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const user = session.user;
  const companyId = user.company?.id;

  if (!companyId) {
    return (
      <div className="p-6 text-red-500 bg-red-50 rounded-lg">
        <p>
          Error: Your account is not linked to a company. You cannot create applications.
        </p>
      </div>
    );
  }

  // Fetch company details for logo
  await dbConnect();
  const company = await Company.findById(companyId).select("name logo").lean();
  const companyData = company ? JSON.parse(JSON.stringify(company)) : null;

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
    <div className=" mx-auto">
      <PageBreadcrumb
        pageTitle=""
        items={[{ label: "Crew Applications", href: "/jobs" }]}
      />

      <CrewApplicationForm
        companyId={companyId}
        companyName={companyData?.name || user.company?.name}
        companyLogo={companyData?.logo}
        mode="create"
        availablePositions={availablePositions}
        initialPosition={initialPosition}
      />
    </div>
  );
}