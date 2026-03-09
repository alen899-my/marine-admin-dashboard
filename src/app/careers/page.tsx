import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";
import { Metadata } from "next";
import Job from "@/models/Job";
import mongoose from "mongoose";
import PublicHeader from "@/layout/Publicheader";
import Error404 from "@/app/(full-width-pages)/(error-pages)/error-404/page";
import CareersLayout from "@/components/Jobs/Careerslayout";
import ApplicationsClosed from "@/components/Jobs/ApplicationsClosed";
import CompaniesTable from "@/components/Jobs/CompaniesTable";
import { getMyApplications } from "@/lib/services/applicationService";

export const metadata: Metadata = {
  title: "Careers | Crew Opportunities",
  description: "Browse companies currently accepting crew applications.",
};

interface PageProps {
  searchParams: Promise<{ company?: string }>;
}

interface JobDoc {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  applicationLink?: string;
  deadline?: Date;
  createdAt: Date;
  companyId: any; // Populated Company
}

export default async function CareersPage({ searchParams }: PageProps) {
  const { company: companyId } = await searchParams;

  const [, session] = await Promise.all([dbConnect(), auth()]);

  if (!session?.user) {
    const redirectTo = companyId ? `/careers?company=${companyId}` : "/careers";
    redirect(`/signin?redirect=${encodeURIComponent(redirectTo)}`);
  }

  // ── BRANCH A: ?company= present ──────────────────────────────────────────
  if (companyId) {
    if (!mongoose.isValidObjectId(companyId)) return <Error404 />;

    const raw = await Company.findOne({ _id: companyId, status: "active", deletedAt: null })
      .select("name logo address")
      .lean();

    if (!raw) {
      return (
        <>
          <PublicHeader />
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
            <div className="text-center max-w-md">
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Not Found</h1>
              <p className="text-gray-500 dark:text-gray-400">
                This application link is invalid or no longer active.
              </p>
            </div>
          </div>
        </>
      );
    }

    const companyData = JSON.parse(JSON.stringify(raw)) as any;

    const [myApplications, activeJobs] = await Promise.all([
      getMyApplications(session.user.id, companyData._id.toString()),
      Job.find({
        companyId: companyData._id,
        status: "active",
        isAccepting: true,
      })
        .select("title description applicationLink deadline createdAt")
        .sort({ createdAt: -1 })
        .lean()
    ]);

    const jobs = activeJobs.map((j: any) => ({
      id: j._id.toString(),
      title: j.title,
      department: companyData.name, // Using company name as department/subtitle
      location: companyData.address ?? "",
      vessel: "",
      description: j.description,
      applicationLink: j.applicationLink, // Pass custom link if it exists
      requirements: [] as string[],
      deadline: j.deadline ? new Date(j.deadline).toISOString() : null, // To manage disabling if past deadline
      postedAt: new Date(j.createdAt).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      }),
    }));

    return (
      <>
        <PublicHeader companyLogo={companyData.logo} />
        <CareersLayout
          companyId={companyData._id.toString()}
          companyName={companyData.name}
          companyLogo={companyData.logo}
          jobs={jobs}
          userEmail={session.user.email ?? ""}
          userName={session.user.fullName ?? ""}
          myApplications={myApplications}
        />
      </>
    );
  }

  // ── BRANCH B: no ?company= → Global Jobs listing ────────────────────────
  const activeJobs = await Job.find({
    status: "active",
    isAccepting: true,
    $or: [
      { deadline: null },
      { deadline: { $gt: new Date() } }
    ]
  })
    .populate("companyId", "name logo address")
    .sort({ createdAt: -1 })
    .lean();

  const jobs = activeJobs.map((j: any) => ({
    _id: j._id.toString(),
    title: j.title,
    description: j.description,
    companyId: j.companyId?._id?.toString() || "",
    companyName: j.companyId?.name || "Unknown Company",
    companyLogo: j.companyId?.logo,
    location: j.companyId?.address || "",
    deadline: j.deadline ? new Date(j.deadline).toISOString() : null,
    applicationLink: j.applicationLink || `/careers/apply?company=${j.companyId?._id}&jobId=${j._id}`,
  }));

  return (
    <>
      <PublicHeader />
      <CompaniesTable jobs={jobs} />
    </>
  );
}