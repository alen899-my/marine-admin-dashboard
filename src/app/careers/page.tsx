import { dbConnect } from "@/lib/db";
import { Metadata } from "next";
import Job from "@/models/Job";
import PublicHeader from "@/layout/Publicheader";
import CompaniesTable from "@/components/Jobs/JobListingTable";
import Error404 from "@/app/(full-width-pages)/(error-pages)/error-404/page";
import { COUNTRIES } from "@/constants/geoData";
import {
  getHiddenCompanyIdsForGlobalCareers,
  renderCompanyCareerJobDetailPage,
  renderCompanyCareersPage,
} from "@/lib/careerPortal";
import { getSettings } from "@/lib/systemSettings.server";

export const metadata: Metadata = {
  title: "Careers | Candidate Opportunities",
  description:
    "Browse companies currently accepting Candidateidate applications.",
};

interface PageProps {
  searchParams: Promise<{ company?: string; jobId?: string }>;
}

// Sort helper: nearest deadline first, null/no-deadline jobs last
function sortByDeadline(jobs: any[]) {
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

export default async function CareersPage({ searchParams }: PageProps) {
  const { company: companyId, jobId } = await searchParams;

  if (companyId) {
    if (jobId) {
      return renderCompanyCareerJobDetailPage({ companyId, jobId });
    }

    return renderCompanyCareersPage({ companyId });
  }

  const globalSettings = await getSettings();
  if (!globalSettings.publicCareersPageEnabled) {
    return <Error404 />;
  }

  // ── BRANCH B: no ?company= → Global Jobs listing ────────────────────────
  await dbConnect();
  const rawActiveJobs = await Job.find({
    isAccepting: true,
    $or: [{ deadline: null }, { deadline: { $gt: new Date() } }],
  })
    .populate("companyId", "name logo address country")
    .lean();

  // Sort: nearest deadline first, no-deadline last
  const sortedActiveJobs = sortByDeadline(rawActiveJobs as any[]);

  const hiddenCompanyIds = await getHiddenCompanyIdsForGlobalCareers(
    sortedActiveJobs
      .map((job: any) => job.companyId?._id?.toString())
      .filter(Boolean),
  );

  const jobs = sortedActiveJobs
    .filter((job: any) => {
      const companyObjectId = job.companyId?._id?.toString();
      return companyObjectId && !hiddenCompanyIds.has(companyObjectId);
    })
    .map((j: any) => ({
      _id: j._id.toString(),
      title: j.title,
      description: j.description,
      companyId: j.companyId?._id?.toString() || "",
      companyName: j.companyId?.name || "Unknown Company",
      companyLogo: j.companyId?.logo,
      location: getCountryLabel(j.companyId?.country),
      deadline: j.deadline ? new Date(j.deadline).toISOString() : null,
      applicationLink:
        j.applicationLink ||
        `/careers/apply?company=${j.companyId?._id}&jobId=${j._id}`,
    }));

  // Extract unique companies for the filter dropdown
  const companiesMap = new Map<string, { _id: string; name: string }>();
  for (const j of jobs) {
    if (j.companyId && !companiesMap.has(j.companyId)) {
      companiesMap.set(j.companyId, { _id: j.companyId, name: j.companyName });
    }
  }
  const companies = Array.from(companiesMap.values());

  return (
    <>
      <PublicHeader />
      <CompaniesTable jobs={jobs} companies={companies} />
    </>
  );
}
