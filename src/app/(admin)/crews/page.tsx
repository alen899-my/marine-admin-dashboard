import { Metadata } from "next";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import {
  getAllCompaniesForDropdown,
  getJobsForDropdown,
} from "@/lib/services/applicationService";
import Crew from "@/models/Crew";
import Candidate from "@/models/Candidate";
import Contract from "@/models/Contract";
import Wage from "@/models/Wage";
import "@/models/Job";
import { pickLatestWage } from "@/lib/wageHistory";
import CrewsPageClient from "./CrewsPageClient";
import CrewsTable from "./CrewsTable";

export const metadata: Metadata = {
  title: "Crews Management | Parkora Falcon",
  description: "View active crews and manage crew filters.",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function CrewsManagement({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    return <div className="p-8 text-center font-medium">Unauthorized Access</div>;
  }

  const authz = await authorizeRequest("crews.view");
  if (!authz.ok) {
    return <div>Access Denied</div>;
  }

  const user = session.user;
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";

  const resolvedParams = await searchParams;
  const sessionCompanyId = user.company?.id;
  const isSuperAdminNoCompany = isSuperAdmin && !resolvedParams.companyId;

  const targetCompanyId =
    isSuperAdmin && resolvedParams.companyId
      ? resolvedParams.companyId
      : sessionCompanyId;

  if (!isSuperAdminNoCompany && !targetCompanyId) {
    return (
      <div className="p-8 text-center text-amber-600 bg-amber-50 rounded-lg border border-amber-200">
        Account Error: Your user profile is not linked to a company. Please
        contact system administration.
      </div>
    );
  }

  if (targetCompanyId && !mongoose.isValidObjectId(targetCompanyId)) {
    return (
      <div className="p-8 text-center text-red-500 font-medium">
        Invalid company ID.
      </div>
    );
  }

  const currentPage = Math.max(1, Number(resolvedParams.page) || 1);
  const limit = 50;

  try {
    await dbConnect();

    // ── Query the Crew collection for active crew
    const crewQuery: any = {
      deletedAt: null,
    };
    if (!isSuperAdminNoCompany && targetCompanyId) {
      crewQuery.company = new mongoose.Types.ObjectId(targetCompanyId);
    }

    const skip = (currentPage - 1) * limit;
    const crewDocs = await Crew.find(crewQuery)
      .sort({ createdAt: -1 })
      .lean();

    const applicationIds = crewDocs.map((c: any) => c.applicationId);


    // ── Fetch Candidate details (with search + jobTitle filters, paginated)
    const candidateQuery: any = {
      _id: { $in: applicationIds },
      deletedAt: null,
    };
    if (resolvedParams.search?.trim()) {
      const s = resolvedParams.search.trim();
      candidateQuery.$or = [
        { firstName: { $regex: s, $options: "i" } },
        { lastName: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
        { rank: { $regex: s, $options: "i" } },
        { nationality: { $regex: s, $options: "i" } },
      ];
    }
    if (resolvedParams.jobTitle?.trim()) {
      candidateQuery.$or = [
        ...(candidateQuery.$or ?? []),
        { positionApplied: { $regex: resolvedParams.jobTitle.trim(), $options: "i" } },
      ];
    }

    const [rawCandidates, filteredTotal] = await Promise.all([
      Candidate.find(candidateQuery)
        .select("-adminNotes -__v")
        .populate("company", "name")
        .populate("jobId", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Candidate.countDocuments(candidateQuery),
    ]);

    // ── Fetch contracts
    const fetchedAppIds = rawCandidates.map((a: any) => a._id);
    const contractsList = await Contract.find({
      applicationId: { $in: fetchedAppIds },
      deletedAt: null,
    })
      .populate("vesselId", "name _id flag imo")
      .sort({ createdAt: -1 })
      .lean();
    const contractMap: Record<string, any> = {};
    for (const c of contractsList as any[]) {
      if (!contractMap[String(c.applicationId)]) contractMap[String(c.applicationId)] = c;
    }

    // ── Fetch wages
    const contractIds = Object.values(contractMap).map((c: any) => c._id);
    const wagesList = contractIds.length
      ? await Wage.find({ contractId: { $in: contractIds }, deletedAt: null })
          .sort({ effectiveFrom: -1, createdAt: -1 })
          .lean()
      : [];
    const wageMap: Record<string, any[]> = {};
    for (const w of wagesList as any[]) {
      const key = String(w.contractId);
      wageMap[key] = wageMap[key] || [];
      wageMap[key].push(w);
    }

    // ── Merge data
    const serializedCandidates = JSON.parse(JSON.stringify(rawCandidates));
    const serializedCrewDocs = JSON.parse(JSON.stringify(crewDocs));
    
    // Build a map from serialized crew docs
    const serializedCrewMap = new Map<string, any>();
    for (const c of serializedCrewDocs) serializedCrewMap.set(String(c.applicationId), c);

    const crewMembers = serializedCandidates.map((app: any) => {
      const crewDoc = serializedCrewMap.get(String(app._id));
      const contract = contractMap[String(app._id)];
      const wagesHistory = contract ? wageMap[String(contract._id)] || [] : [];
      const wage = pickLatestWage(wagesHistory);

      return {
        ...app,
        companyName: app.company?.name ?? "",
        company: app.company?._id ?? app.company,
        positionApplied: app.jobId?.title || app.positionApplied || "",
        jobTitle: app.jobId?.title ?? null,
        jobId: app.jobId?._id ?? app.jobId ?? null,
        // Crew fields from Crew document
        crewId: crewDoc ? String((crewDoc as any)._id) : null,
        crew: crewDoc?.crewStatus ?? app.crew ?? "inactive",
        crewStatus: crewDoc?.crewStatus ?? "inactive",
        onboardDate: crewDoc?.onboardDate ?? app.onboardDate ?? null,
        onboardPort: crewDoc?.onboardPort ?? app.onboardPort ?? null,
        contractStart: crewDoc?.contractStart ?? app.contractStart ?? null,
        contractEnd: crewDoc?.contractEnd ?? app.contractEnd ?? null,
        contractPeriod: crewDoc?.contractPeriod ?? app.contractPeriod ?? null,
        onboardingChecklist: crewDoc?.onboardingChecklist ?? app.onboardingChecklist ?? [],
        leaveLimits: crewDoc?.leaveLimits ?? app.leaveLimits ?? [],
        // Contract details
        contractStatus: contract?.contractStatus ?? null,
        cdcIndosNo: contract ? `${contract.cdcNo || ""} / ${contract.indosNo || ""}` : null,
        vesselOrPort: contract ? `${contract.vesselId?.name || contract.vesselName || ""} / ${contract.portOfJoining || ""}` : null,
        commencement: contract?.commencement ?? null,
        basicWages: wage?.basic ? `$${wage.basic.toLocaleString()}` : null,
        contractRaw: contract
          ? JSON.parse(JSON.stringify({ ...contract, wages: wage, wagesHistory }))
          : null,
      };
    });

    const pagination = {
      total: filteredTotal,
      page: currentPage,
      limit,
      totalPages: Math.max(1, Math.ceil(filteredTotal / limit)),
    };

    const [companies, jobs] = await Promise.all([
      isSuperAdmin
        ? getAllCompaniesForDropdown()
        : Promise.resolve([] as { id: string; name: string }[]),
      getJobsForDropdown(
        isSuperAdminNoCompany ? undefined : (targetCompanyId ?? undefined),
      ),
    ]);

    return (
      <CrewsPageClient
        totalCount={pagination.total}
        companies={companies}
        jobs={jobs}
        isSuperAdmin={isSuperAdmin}
      >
        <CrewsTable
          data={crewMembers}
          pagination={{
            page: currentPage,
            limit,
            total: pagination.total,
            totalPages: pagination.totalPages,
          }}
        />
      </CrewsPageClient>
    );
  } catch (error) {
    console.error("CREWS MANAGEMENT PAGE ERROR →", error);
    return (
      <div className="p-8 text-center text-red-500 font-medium">
        Error loading crews. Please try again later.
      </div>
    );
  }
}
