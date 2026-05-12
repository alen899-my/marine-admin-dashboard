import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Candidate from "@/models/Candidate";
import Company from "@/models/Company";
import CandidateApplicationForm from "@/components/Jobs/Application";
import { notFound, redirect } from "next/navigation";
import mongoose from "mongoose";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { fetchActiveJobPositions } from "@/lib/services/applicationService";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditApplicationPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user;
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return (
      <div className="p-8 text-center text-red-500 font-medium">
        Invalid application ID.
      </div>
    );
  }

  await dbConnect();

  const raw = await Candidate.findOne({ _id: id, deletedAt: null })
    .populate("jobId", "title")
    .select("-adminNotes -__v")
    .lean();
  if (!raw) notFound();

  const application = JSON.parse(JSON.stringify(raw));
  if (application.jobId && typeof application.jobId === "object") {
    application.positionApplied =
      application.jobId.title || application.positionApplied || "";
    application.jobId = application.jobId._id;
  }

  const companyId =
    typeof application.company === "string"
      ? application.company
      : (application.company?.$oid ?? String(application.company));

  const [company, activePositions] = await Promise.all([
    Company.findById(companyId).select("name logo").lean(),
    fetchActiveJobPositions(companyId),
  ]);
  const companyData = company ? JSON.parse(JSON.stringify(company)) : null;

  const availablePositions = [...activePositions];
  if (application.jobId && application.positionApplied) {
    const jobIdStr = application.jobId.toString();
    const exists = availablePositions.some((p) => p.value === jobIdStr);
    if (!exists) {
      availablePositions.push({
        value: jobIdStr,
        label: application.positionApplied,
      });
    }
  }

  let companiesProp: { value: string; label: string }[] = [];
  if (isSuperAdmin) {
    const allCompanies = await Company.find({ deletedAt: null })
      .select("name")
      .sort({ name: 1 })
      .lean();
    companiesProp = (allCompanies as any[]).map((c) => ({
      value: c._id.toString(),
      label: c.name,
    }));
  }

  return (
    <div className="">
      <PageBreadcrumb
        pageTitle=""
        items={[{ label: "Candidate Applications", href: "/candidates" }]}
      />
      <CandidateApplicationForm
        mode="edit"
        companyId={companyId}
        companyName={companyData?.name}
        companyLogo={companyData?.logo}
        initialData={application}
        applicationId={id}
        availablePositions={availablePositions}
        jobId={application.jobId?.toString()}
        isSuperAdmin={isSuperAdmin}
        companies={companiesProp}
      />
    </div>
  );
}
