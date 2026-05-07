import { auth } from "@/auth";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import Crew from "@/models/Crew";
import Candidate from "@/models/Candidate";
import Contract from "@/models/Contract";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { pickLatestWage } from "@/lib/wageHistory";

// ─────────────────────────────────────────────────────────────────────
// GET /api/crews — list all crew members from the Crew collection
// ─────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const authz = await authorizeRequest("crews.view");
    if (!authz.ok) return authz.response;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Number(searchParams.get("limit")) || 50);
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const crewStatus = searchParams.get("crewStatus") || "";
    const jobTitle = searchParams.get("jobTitle") || "";

    const user = session.user;
    const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
    const companyId = isSuperAdmin
      ? (searchParams.get("companyId") || undefined)
      : (user.company?.id || undefined);

    // ── Build Crew query
    const crewQuery: any = { deletedAt: null };

    if (companyId && mongoose.isValidObjectId(companyId)) {
      crewQuery.company = new mongoose.Types.ObjectId(companyId);
    }

    if (crewStatus && crewStatus !== "all") {
      if (crewStatus === "active") {
        crewQuery.crewStatus = {
          $in: ["onboard", "vacation", "available", "traveling", "medical_leave", "training"],
        };
      } else {
        crewQuery.crewStatus = crewStatus;
      }
    } else {
      // Default: all non-inactive statuses
      crewQuery.crewStatus = {
        $in: ["onboard", "vacation", "available", "traveling", "medical_leave", "training"],
      };
    }

    // ── Fetch Crew documents
    const crewDocs = await Crew.find(crewQuery)
      .sort({ createdAt: -1 })
      .lean();

    const applicationIds = crewDocs.map((c: any) => c.applicationId);

    if (!applicationIds.length) {
      return NextResponse.json({
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
      });
    }

    // ── Build Candidate query (for search/jobTitle filtering)
    const candidateQuery: any = {
      _id: { $in: applicationIds },
      deletedAt: null,
    };

    if (search.trim()) {
      const s = search.trim();
      candidateQuery.$or = [
        { firstName: { $regex: s, $options: "i" } },
        { lastName: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
        { rank: { $regex: s, $options: "i" } },
        { nationality: { $regex: s, $options: "i" } },
      ];
    }

    if (jobTitle?.trim()) {
      const Job = (await import("@/models/Job")).default;
      const escapedJobTitle = jobTitle.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matchingJobs = await Job.find({
        title: { $regex: escapedJobTitle, $options: "i" },
      })
        .select("_id")
        .lean();
      const jobIds = (matchingJobs as any[]).map((j) => j._id);

      if (jobIds.length > 0) {
        candidateQuery.$or = [
          { jobId: { $in: jobIds } },
          { positionApplied: { $regex: escapedJobTitle, $options: "i" } },
        ];
      } else {
        candidateQuery.positionApplied = { $regex: escapedJobTitle, $options: "i" };
      }
    }

    // ── Fetch matching candidates (with pagination on the candidate side)
    const [candidates, total] = await Promise.all([
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

    const serialized = JSON.parse(JSON.stringify(candidates));

    // ── Build Crew map by applicationId for quick lookup
    const crewMap = new Map<string, any>();
    for (const crew of crewDocs) {
      crewMap.set(String((crew as any).applicationId), crew);
    }

    // ── Fetch contracts
    const contractMap: Record<string, any> = {};
    const fetchedAppIds = serialized.map((a: any) => a._id);
    const contracts = await Contract.find({
      applicationId: { $in: fetchedAppIds },
      deletedAt: null,
    })
      .populate("vesselId", "name _id flag imo")
      .sort({ createdAt: -1 })
      .lean();

    for (const c of contracts as any[]) {
      if (!contractMap[c.applicationId]) {
        contractMap[c.applicationId] = c;
      }
    }

    // ── Fetch wages
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

    // ── Merge everything
    const data = serialized.map((app: any) => {
      const crewDoc = crewMap.get(String(app._id));
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

        // Crew-specific fields from Crew document
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
        vesselOrPort: contract
          ? `${contract.vesselId?.name || contract.vesselName || ""} / ${contract.portOfJoining || ""}`
          : null,
        commencement: contract?.commencement ?? null,
        period: contract?.contractPeriod ?? null,
        basicWages: wage?.basic ? `$${wage.basic.toLocaleString()}` : null,
        contractRaw: contract
          ? JSON.parse(JSON.stringify({ ...contract, wages: wage, wagesHistory }))
          : null,
      };
    });

    return NextResponse.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error: any) {
    console.error("GET CREWS ERROR →", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
