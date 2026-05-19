import { auth } from "@/auth";
import Error404 from "@/app/(full-width-pages)/(error-pages)/error-404/page";
import CareersLayout from "@/components/Jobs/Careerslayout";
import CompaniesTable from "@/components/Jobs/JobListingTable";
import { COUNTRIES } from "@/constants/geoData";
import { dbConnect } from "@/lib/db";
import { getMyApplications } from "@/lib/services/applicationService";
import PublicHeader from "@/layout/Publicheader";
import Company from "@/models/Company";
import Job from "@/models/Job";
import SystemSetting from "@/models/SystemSetting";
import { getSettings } from "@/lib/systemSettings.server";
import mongoose from "mongoose";

function sortByDeadline<T extends { deadline?: Date | string | null }>(jobs: T[]) {
  return jobs.sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
}

function getCountryLabel(countryCode?: string) {
  if (!countryCode) return "";
  return (
    COUNTRIES.find((country) => country.value === countryCode)?.label ||
    countryCode
  );
}

export async function getHiddenCompanyIdsForGlobalCareers(companyIds: string[]) {
  if (companyIds.length === 0) {
    return new Set<string>();
  }

  await dbConnect();

  const hiddenSettings = await SystemSetting.find({
    key: "global",
    companyId: {
      $in: companyIds
        .filter((companyId) => mongoose.isValidObjectId(companyId))
        .map((companyId) => new mongoose.Types.ObjectId(companyId)),
    },
    showOnGlobalCareersPage: false,
  })
    .select("companyId")
    .lean();

  return new Set(
    hiddenSettings
      .map((setting: any) => setting.companyId?.toString())
      .filter(Boolean),
  );
}

export async function getGlobalCareerCompanyNames() {
  await dbConnect();

  const rawActiveJobs = await Job.find({
    isAccepting: true,
    $or: [{ deadline: null }, { deadline: { $gt: new Date() } }],
  })
    .populate("companyId", "name")
    .lean();

  const companyIds = rawActiveJobs
    .map((job: any) => job.companyId?._id?.toString())
    .filter(Boolean);
  const hiddenCompanyIds = await getHiddenCompanyIdsForGlobalCareers(companyIds);
  const companiesMap = new Map<string, string>();

  for (const job of rawActiveJobs as any[]) {
    const companyId = job.companyId?._id?.toString();
    const companyName = job.companyId?.name;
    if (companyId && companyName && !hiddenCompanyIds.has(companyId)) {
      companiesMap.set(companyId, companyName);
    }
  }

  return Array.from(companiesMap.values()).sort((a, b) => a.localeCompare(b));
}

export async function renderCompanyCareersPage({
  companyId,
}: {
  companyId: string;
}) {
  if (!mongoose.isValidObjectId(companyId)) {
    return <Error404 />;
  }

  await dbConnect();

  const companySettings = await getSettings({ companyId });
  if (!companySettings.companyCareersPageEnabled) {
    return <Error404 />;
  }

  const rawCompany = await Company.findOne({
    _id: companyId,
    status: "active",
    deletedAt: null,
  })
    .select("name logo address country")
    .lean();

  if (!rawCompany) {
    return (
      <>
        <PublicHeader />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
              Not Found
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              This application link is invalid or no longer active.
            </p>
          </div>
        </div>
      </>
    );
  }

  const company = JSON.parse(JSON.stringify(rawCompany)) as {
    _id: string;
    name: string;
    logo?: string;
    address?: string;
    country?: string;
  };

  const rawActiveJobs = await Job.find({
    companyId: company._id,
    isAccepting: true,
    $or: [{ deadline: null }, { deadline: { $gt: new Date() } }],
  })
    .select("title description applicationLink deadline createdAt")
    .lean();

  const jobs = sortByDeadline(rawActiveJobs as any[]).map((job: any) => ({
    _id: job._id.toString(),
    title: job.title,
    description: job.description,
    companyId: company._id.toString(),
    companyName: company.name,
    companyLogo: company.logo,
    location: getCountryLabel(company.country),
    deadline: job.deadline ? new Date(job.deadline).toISOString() : null,
    applicationLink:
      job.applicationLink ||
      `/careers/apply?company=${company._id}&jobId=${job._id}`,
  }));

  return (
    <>
      <PublicHeader companyLogo={company.logo} />
      <CompaniesTable
        jobs={jobs}
        companies={[{ _id: company._id.toString(), name: company.name }]}
        heroEyebrow={company.name}
        heroTitle={`Open roles at ${company.name}`}
        heroDescription="Explore current openings for this company and review each position before you apply."
        listingTitle={`Open positions at ${company.name}`}
        listingDescription="Browse active job postings for this company."
        hideCompanyFilter={true}
      />
    </>
  );
}

export async function renderCompanyCareerJobDetailPage({
  companyId,
  jobId,
}: {
  companyId: string;
  jobId: string;
}) {
  if (!mongoose.isValidObjectId(companyId) || !mongoose.isValidObjectId(jobId)) {
    return <Error404 />;
  }

  const [, session] = await Promise.all([dbConnect(), auth()]);

  const companySettings = await getSettings({ companyId });
  if (!companySettings.companyCareersPageEnabled) {
    return <Error404 />;
  }

  const rawCompany = await Company.findOne({
    _id: companyId,
    status: "active",
    deletedAt: null,
  })
    .select("name logo address")
    .lean();

  if (!rawCompany) {
    return <Error404 />;
  }

  const company = JSON.parse(JSON.stringify(rawCompany)) as {
    _id: string;
    name: string;
    logo?: string;
    address?: string;
  };

  const [myApplications, rawActiveJobs] = await Promise.all([
    session?.user?.id
      ? getMyApplications(session.user.id, company._id.toString(), jobId)
      : Promise.resolve([]),
    Job.find({
      companyId: company._id,
      isAccepting: true,
      $or: [{ deadline: null }, { deadline: { $gt: new Date() } }],
    })
      .select("title description applicationLink deadline createdAt")
      .lean(),
  ]);

  const jobs = sortByDeadline(rawActiveJobs as any[]).map((job: any) => ({
    id: job._id.toString(),
    title: job.title,
    department: company.name,
    location: company.address ?? "",
    vessel: "",
    description: job.description,
    applicationLink: job.applicationLink,
    requirements: [] as string[],
    deadline: job.deadline ? new Date(job.deadline).toISOString() : null,
    postedAt: new Date(job.createdAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  }));

  const displayJobs = jobs.filter((job) => job.id === jobId);

  if (displayJobs.length === 0) {
    return <Error404 />;
  }

  return (
    <>
      <PublicHeader companyLogo={company.logo} />
      <CareersLayout
        companyId={company._id.toString()}
        companyName={company.name}
        companyLogo={company.logo}
        userEmail={session?.user?.email ?? ""}
        userName={session?.user?.fullName ?? ""}
        myApplications={myApplications}
        jobs={displayJobs}
        jobId={jobId}
      />
    </>
  );
}
