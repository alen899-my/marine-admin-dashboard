import { dbConnect } from "@/lib/db";
import Candidate from "@/models/Candidate";
import Company from "@/models/Company";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Contract from "@/models/Contract";
import Vessel from "@/models/Vessel";
import Job from "@/models/Job";
import { pickLatestWage } from "@/lib/wageHistory";

const _ensureModels = [Candidate, Company, Contract, Vessel, Job];


interface GetCandidateApplicationsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string | string[];
  rank?: string;
  nationality?: string;
  startDate?: string;
  endDate?: string;
  companyId?: string;  // ← add: explicit company filter (used by super admin)
  jobTitle?: string;
  crew?: string | string[];
  excludeIds?: string[]; // ← exclude specific application IDs (used by onboarding to skip already-crew'd)
  user: any;
}

export async function getCandidateApplications({
  page = 1,
  limit = 10,
  search = "",
  status = "all",
  rank,
  nationality,
  startDate,
  endDate,
  companyId,
  jobTitle,
  crew,
  excludeIds,
  user,
}: GetCandidateApplicationsParams) {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = companyId || user.company?.id;
  const skip = (page - 1) * limit;

  // Super admin with no company filter — return empty (they must pick a company)
  if (!userCompanyId && !isSuperAdmin) {
    return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
  }

  const query: any = { deletedAt: null };

  // Scope to company — super admin can see all if no companyId passed
  if (userCompanyId) {
    if (!mongoose.isValidObjectId(userCompanyId)) {
      return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    }
    // If it's a superadmin and they didn't explicitly pick a company, don't restrict the query
    if (!isSuperAdmin || companyId) {
      query.company = new mongoose.Types.ObjectId(userCompanyId);
    }
  }

  if (status && status !== "all") {
    if (Array.isArray(status)) {
      query.status = { $in: status };
    } else {
      query.status = status;
    }
  } else {
    // If status is "all" or not provided, exclude onboarded candidates to keep the pipeline clean
    query.status = { $ne: "onboarded" };
  }
  if (rank?.trim()) query.rank = { $regex: rank.trim(), $options: "i" };
  if (nationality?.trim()) query.nationality = { $regex: nationality.trim(), $options: "i" };

  if (crew) {
    if (Array.isArray(crew)) {
      query.crew = { $in: crew };
    } else if (crew !== "all") {
      query.crew = crew;
    }
  }

  // Exclude specific application IDs (e.g. already-onboarded crew docs)
  if (excludeIds && excludeIds.length > 0) {
    const validExcludeIds = excludeIds
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    if (validExcludeIds.length > 0) {
      query._id = { $nin: validExcludeIds };
    }
  }

  // Build search $or clause
  let searchOrClause: any[] | undefined;
  if (search.trim()) {
    const s = search.trim();
    searchOrClause = [
      { firstName: { $regex: s, $options: "i" } },
      { lastName: { $regex: s, $options: "i" } },
      { email: { $regex: s, $options: "i" } },
      { rank: { $regex: s, $options: "i" } },
      { nationality: { $regex: s, $options: "i" } },
    ];
  }

  // Build jobTitle $or clause
  let jobTitleOrClause: any[] | undefined;
  if (jobTitle?.trim()) {
    // Don't filter by status - include all jobs (active, inactive, archived)
    // so we can filter applications that were submitted for those jobs
    const escapedJobTitle = jobTitle.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const jobQuery: any = {
      title: { $regex: escapedJobTitle, $options: "i" },
    };
    if (userCompanyId) {
      jobQuery.companyId = new mongoose.Types.ObjectId(userCompanyId);
    }
    const matchingJobs = await Job.find(jobQuery).select("_id").lean();
    const jobIds = matchingJobs.map((j: any) => j._id);

    // Filter by jobId if we found matching jobs, OR by positionApplied as fallback
    // for applications that don't have jobId set
    if (jobIds.length > 0) {
      jobTitleOrClause = [
        { jobId: { $in: jobIds } },
        { positionApplied: { $regex: escapedJobTitle, $options: "i" } },
      ];
    } else {
      // If no matching jobs found, still try to match by positionApplied
      query.positionApplied = { $regex: escapedJobTitle, $options: "i" };
    }
  }

  // Combine $or clauses if both search and jobTitle are provided
  if (searchOrClause && jobTitleOrClause) {
    query.$or = [
      ...searchOrClause,
      ...jobTitleOrClause,
    ];
  } else if (searchOrClause) {
    query.$or = searchOrClause;
  } else if (jobTitleOrClause) {
    query.$or = jobTitleOrClause;
  }

  if (startDate || endDate) {
    const dateQuery: any = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateQuery.$lte = end;
    }
    query.createdAt = dateQuery;
  }

  const [data, total] = await Promise.all([
    Candidate.find(query)
      .select("-adminNotes -__v")
      .populate("company", "name")
      .populate("jobId", "title description")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Candidate.countDocuments(query),
  ]);

  const serialized = JSON.parse(JSON.stringify(data));

  // Fetch contracts for these applications to enrich the table
  const applicationIds = serialized.map((app: any) => app._id);
  const contracts = await Contract.find({ applicationId: { $in: applicationIds } })
    .populate("vesselId", "name _id flag imo")
    .sort({ createdAt: -1 })
    .lean();

  const contractMap: Record<string, any> = {};
  for (const c of contracts as any[]) {
    // Keep only the most recent contract for each application
    if (!contractMap[c.applicationId]) {
      contractMap[c.applicationId] = c;
    }
  }

  // Fetch wages for these contracts
  const contractIds = Object.values(contractMap).map((c: any) => c._id);
  const Wage = (await import("@/models/Wage")).default;
  const wagesList = await Wage.find({
    contractId: { $in: contractIds },
    deletedAt: null,
  })
    .sort({ effectiveFrom: -1, createdAt: -1 })
    .lean();
  const wageMap: Record<string, any[]> = {};
  for (const w of wagesList as any[]) {
    const key = String(w.contractId);
    wageMap[key] = wageMap[key] || [];
    wageMap[key].push(w);
  }

  return {
    data: serialized.map((app: any) => {
      const contract = contractMap[app._id];
      const wagesHistory = contract ? wageMap[String(contract._id)] || [] : [];
      const wage = pickLatestWage(wagesHistory);
      return {
        ...app,
        companyName: app.company?.name ?? "",
        company: app.company?._id ?? app.company,

        positionApplied: app.jobId?.title || app.positionApplied || "",
        jobTitle: app.jobId?.title ?? null,
        jobId: app.jobId?._id ?? app.jobId ?? null,

        // Contract details
        contractStatus: contract?.contractStatus ?? null,
        cdcIndosNo: contract ? `${contract.cdcNo || ""} / ${contract.indosNo || ""}` : null,
        vesselOrPort: contract ? `${contract.vesselId?.name || contract.vesselName || ""} / ${contract.portOfJoining || ""}` : null,
        commencement: contract?.commencement ?? null,
        period: contract?.contractPeriod ?? null,
        basicWages: wage?.basic ? `$${wage.basic.toLocaleString()}` : null,
        contractRaw: contract
          ? JSON.parse(
              JSON.stringify({ ...contract, wages: wage, wagesHistory }),
            )
          : null,
      };
    }),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

// ── Dropdown helper for super admin ────────────────────────────────────────
export async function getAllCompaniesForDropdown(): Promise<{ id: string; name: string }[]> {
  await dbConnect();
  const companies = await Company.find({ deletedAt: null, status: "active" })
    .select("_id name")
    .sort({ name: 1 })
    .lean();
  return companies.map((c: any) => ({ id: c._id.toString(), name: c.name }));
}

export async function getMyApplications(userId: string, companyId: string, jobId?: string) {
  await dbConnect();

  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(companyId)) {
    return [];
  }

  const query: any = {
    userId: new mongoose.Types.ObjectId(userId),
    company: new mongoose.Types.ObjectId(companyId),
    deletedAt: null,
  };

  if (jobId && mongoose.isValidObjectId(jobId)) {
    query.jobId = new mongoose.Types.ObjectId(jobId);
  }

  const applications = await Candidate.find(query)
    .select("_id status firstName lastName rank positionApplied jobId createdAt updatedAt")
    .populate("jobId", "title isAccepting deadline")
    .sort({ updatedAt: -1 })
    .lean();

  const serialized = JSON.parse(JSON.stringify(applications));
  return serialized.map((app: any) => ({
    ...app,
    positionApplied: app.jobId?.title ?? app.positionApplied ?? "",
    jobId: app.jobId?._id ?? app.jobId ?? null,
    jobIsAccepting: app.jobId?.isAccepting ?? true,
    deadline: app.jobId?.deadline ?? null,
  }));
}

// ── Get one application (for view mode — must belong to userId) ────────────
export async function getMyApplicationById(userId: string, applicationId: string) {
  await dbConnect();

  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(applicationId)) {
    return null;
  }

  const application = await Candidate.findOne({
    _id: new mongoose.Types.ObjectId(applicationId),
    userId: new mongoose.Types.ObjectId(userId),
    deletedAt: null,
  })
    .populate("jobId", "title isAccepting deadline")
    .lean();

  if (!application) return null;

  const app = JSON.parse(JSON.stringify(application));
  return {
    ...app,
    positionApplied: app.jobId?.title ?? app.positionApplied ?? "",
    jobId: app.jobId?._id ?? app.jobId ?? null,
    jobIsAccepting: app.jobId?.isAccepting ?? true,
    deadline: app.jobId?.deadline ?? null,
  };
}


export async function requireCareerAuth(redirectPath: string) {
  const [, session] = await Promise.all([dbConnect(), auth()]);
  if (!session?.user) {
    redirect(`/signin?redirect=${encodeURIComponent(redirectPath)}`);
  }
  return session;
}

export async function fetchCareerCompany(
  companyId: string,
  select: string = "name logo",
) {
  if (!mongoose.isValidObjectId(companyId)) notFound();
  await dbConnect();

  const company = await Company.findOne({
    _id: companyId,
    status: "active",
    deletedAt: null,
  })
    .select(select)
    .lean<{
      _id: mongoose.Types.ObjectId;
      name: string;
      logo?: string;
    }>();

  if (!company) notFound();
  return company;
}


// ── Get ALL applications by userId across all companies ────────────────────
export async function getAllMyApplications(userId: string) {
  await dbConnect();

  if (!mongoose.isValidObjectId(userId)) return [];

  const applications = await Candidate.find({
    userId: new mongoose.Types.ObjectId(userId),
    deletedAt: null,
  })
    .select("_id status firstName lastName rank positionApplied jobId createdAt updatedAt company")
    .populate("company", "name logo")
    .populate("jobId", "title isAccepting deadline")
    .sort({ updatedAt: -1 })
    .lean();

  const serialized = JSON.parse(JSON.stringify(applications));
  return serialized.map((app: any) => ({
    ...app,
    positionApplied: app.jobId?.title ?? app.positionApplied ?? "",
    jobIsAccepting: app.jobId?.isAccepting ?? true,   // ← add
    deadline: app.jobId?.deadline ?? null,             // ← add
    jobId: app.jobId?._id ?? app.jobId ?? null,
  }));
}

export async function getLastApplicationByUser(userId: string) {
  await dbConnect();

  if (!mongoose.isValidObjectId(userId)) return null;

  const application = await Candidate.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    deletedAt: null,
  })
    .select(
      // Exclude job-specific fields — those must be filled fresh
      "-positionApplied -rank -dateOfAvailability -availabilityNote " +
      // Exclude admin/internal fields
      "-adminNotes -status -completedSteps -formSource -submissionToken -lastEditedBy " +
      "-assignedTo -deletedAt -__v"
    )
    .sort({ updatedAt: -1 })
    .lean();

  return application ? JSON.parse(JSON.stringify(application)) : null;
}

export async function getJobsForDropdown(companyId?: string): Promise<{ value: string; label: string }[]> {
  await dbConnect();
  // Don't filter by status - include all jobs (active, inactive, archived)
  // so we can filter applications that were submitted for those jobs
  const query: any = {};
  if (companyId && mongoose.isValidObjectId(companyId)) {
    query.companyId = new mongoose.Types.ObjectId(companyId);
  }

  const jobs = await Job.find(query)
    .select("title")
    .sort({ title: 1 })
    .lean();

  // Deduplicate titles
  const seen = new Set<string>();
  const options: { value: string; label: string }[] = [];
  for (const j of jobs as any[]) {
    if (j.title && !seen.has(j.title)) {
      seen.add(j.title);
      options.push({ value: j.title, label: j.title });
    }
  }
  return options;
}
//fetchActiveJobPositions(companyId) — builds availablePositions array. Used in: careers/edit, careers/apply, admin/jobs/edit, admin/jobs/apply
export async function fetchActiveJobPositions(companyId: string) {
  const jobs = await Job.find({ companyId, isAccepting: true })
    .select("_id title")
    .sort({ createdAt: -1 })
    .lean();
  return (jobs as any[]).map((j) => ({ value: j._id.toString(), label: j.title }));
}

//resolveApplicationPosition(application) — resolves jobId → title. Used in: careers/view, admin/jobs/view
export async function resolveApplicationPosition(application: any) {
  if (!application?.jobId) return application;
  const job = await Job.findById(application.jobId).select("title").lean() as any;
  return { ...application, positionApplied: job?.title ?? application.positionApplied ?? "" };
}

export async function getContractCount({
  companyId,
  user,
}: {
  companyId?: string;
  user: any;
}) {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = companyId || user.company?.id;

  if (!userCompanyId && !isSuperAdmin) {
    return 0;
  }

  const query: any = {
    deletedAt: null,
    status: { $in: ["selected", "offer_sea_issued"] },
  };

  if (userCompanyId) {
    if (!mongoose.isValidObjectId(userCompanyId)) {
      return 0;
    }
    if (!isSuperAdmin || companyId) {
      query.company = new mongoose.Types.ObjectId(userCompanyId);
    }
  }

  return await Candidate.countDocuments(query);
}

export async function getOnboardingCount({
  companyId,
  user,
}: {
  companyId?: string;
  user: any;
}) {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = companyId || user.company?.id;

  if (!userCompanyId && !isSuperAdmin) {
    return 0;
  }

  // Candidates in accepted/onboarding_ready that do NOT yet have a Crew doc
  const Crew = (await import("@/models/Crew")).default;

  const crewQuery: any = { deletedAt: null };
  if (userCompanyId && mongoose.isValidObjectId(userCompanyId)) {
    if (!isSuperAdmin || companyId) {
      crewQuery.company = new mongoose.Types.ObjectId(userCompanyId);
    }
  }
  const existingCrewAppIds = await Crew.find(crewQuery)
    .distinct("applicationId")
    .lean();

  const query: any = {
    deletedAt: null,
    status: { $in: ["accepted", "onboarding_ready"] },
  };

  if (existingCrewAppIds.length > 0) {
    query._id = { $nin: existingCrewAppIds };
  }

  if (userCompanyId) {
    if (!mongoose.isValidObjectId(userCompanyId)) {
      return 0;
    }
    if (!isSuperAdmin || companyId) {
      query.company = new mongoose.Types.ObjectId(userCompanyId);
    }
  }

  return await Candidate.countDocuments(query);
}
export async function getCandidateCount({
  companyId,
  user,
}: {
  companyId?: string;
  user: any;
}) {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = companyId || user.company?.id;

  if (!userCompanyId && !isSuperAdmin) {
    return 0;
  }

  const query: any = {
    deletedAt: null,
    status: "submitted",
  };

  if (userCompanyId) {
    if (!mongoose.isValidObjectId(userCompanyId)) {
      return 0;
    }
    if (!isSuperAdmin || companyId) {
      query.company = new mongoose.Types.ObjectId(userCompanyId);
    }
  }

  return await Candidate.countDocuments(query);
}
