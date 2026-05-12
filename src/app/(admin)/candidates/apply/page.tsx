import { auth } from "@/auth";
import { redirect } from "next/navigation";
import mongoose from "mongoose";
import CandidateApplicationForm from "@/components/Jobs/Application";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";
import Job from "@/models/Job";
import { fetchActiveJobPositions } from "@/lib/services/applicationService";

export default async function NewApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const { jobId } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const user = session.user;
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";

  await dbConnect();

  const breadcrumb = (
    <PageBreadcrumb
      pageTitle=""
      items={[{ label: "Candidate Applications", href: "/candidates" }]}
    />
  );

  if (isSuperAdmin) {
    const allCompanies = await Company.find({ deletedAt: null })
      .select("name")
      .sort({ name: 1 })
      .lean();

    return (
      <div className="mx-auto">
        {breadcrumb}
        <CandidateApplicationForm
          companyId=""
          mode="create"
          isSuperAdmin={true}
          companies={(allCompanies as any[]).map((c) => ({
            value: c._id.toString(),
            label: c.name,
          }))}
          jobId={jobId}
        />
      </div>
    );
  }

  const companyId = user.company?.id;
  if (!companyId) {
    return (
      <div className="p-6 text-red-500 bg-red-50 rounded-lg">
        Error: Your account is not linked to a company. You cannot create
        applications.
      </div>
    );
  }

  const [company, availablePositions] = await Promise.all([
    Company.findById(companyId).select("name logo").lean(),
    fetchActiveJobPositions(companyId),
  ]);
  const companyData = company ? JSON.parse(JSON.stringify(company)) : null;

  const initialPosition =
    jobId && mongoose.isValidObjectId(jobId)
      ? ((
          (await Job.findById(jobId).select("_id").lean()) as any
        )?._id.toString() ?? "")
      : "";

  return (
    <div className="mx-auto">
      {breadcrumb}
      <CandidateApplicationForm
        companyId={companyId}
        companyName={companyData?.name || user.company?.name}
        companyLogo={companyData?.logo}
        mode="create"
        availablePositions={availablePositions}
        initialPosition={initialPosition}
        jobId={jobId}
      />
    </div>
  );
}
