import { auth } from "@/auth";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import Crew from "@/models/Crew";
import Candidate from "@/models/Candidate";
import Contract from "@/models/Contract";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { pickLatestWage } from "@/lib/wageHistory";
import { CREW_STATUSES } from "@/models/Candidate";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ─────────────────────────────────────────────────────────────────────
// GET /api/crews/[id] — get single crew by applicationId
// ─────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const authz = await authorizeRequest("crews.view");
    if (!authz.ok) return authz.response;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await dbConnect();

    const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";

    // Find Crew by applicationId
    const crewQuery: any = { applicationId: new mongoose.Types.ObjectId(id), deletedAt: null };
    if (!isSuperAdmin && session.user.company?.id) {
      crewQuery.company = new mongoose.Types.ObjectId(session.user.company.id);
    }

    const crewDoc = await Crew.findOne(crewQuery).lean();
    if (!crewDoc) {
      return NextResponse.json({ error: "Crew not found" }, { status: 404 });
    }

    // Fetch candidate details
    const candidate = await Candidate.findOne({
      _id: new mongoose.Types.ObjectId(id),
      deletedAt: null,
    })
      .select("-adminNotes -__v")
      .populate("company", "name")
      .populate("jobId", "title")
      .lean();

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // Fetch latest contract
    const latestContract = await Contract.findOne({
      applicationId: new mongoose.Types.ObjectId(id),
      deletedAt: null,
    })
      .populate("vesselId", "name _id flag imo")
      .sort({ createdAt: -1 })
      .lean();

    let wagesHistory: any[] = [];
    let latestWage = null;
    if (latestContract) {
      const Wage = (await import("@/models/Wage")).default;
      wagesHistory = await Wage.find({
        contractId: latestContract._id,
        deletedAt: null,
      })
        .sort({ effectiveFrom: -1, createdAt: -1 })
        .lean();
      latestWage = pickLatestWage(wagesHistory);
    }

    const serialized = JSON.parse(JSON.stringify(candidate));
    const crewSerialized = JSON.parse(JSON.stringify(crewDoc));

    return NextResponse.json({
      success: true,
      data: {
        ...serialized,
        companyName: (serialized.company as any)?.name ?? "",
        company: (serialized.company as any)?._id ?? serialized.company,
        positionApplied: (serialized.jobId as any)?.title || serialized.positionApplied || "",
        jobTitle: (serialized.jobId as any)?.title ?? null,
        jobId: (serialized.jobId as any)?._id ?? serialized.jobId ?? null,

        // Crew document fields
        crewId: String(crewSerialized._id),
        crew: crewSerialized.crewStatus,
        crewStatus: crewSerialized.crewStatus,
        onboardDate: crewSerialized.onboardDate ?? null,
        onboardPort: crewSerialized.onboardPort ?? null,
        contractStart: crewSerialized.contractStart ?? null,
        contractEnd: crewSerialized.contractEnd ?? null,
        contractPeriod: crewSerialized.contractPeriod ?? null,
        onboardingChecklist: crewSerialized.onboardingChecklist ?? [],
        leaveLimits: crewSerialized.leaveLimits ?? [],

        // Contract
        contractRaw: latestContract
          ? JSON.parse(JSON.stringify({ ...latestContract, wages: latestWage, wagesHistory }))
          : null,
      },
    });
  } catch (error: any) {
    console.error("GET CREW [id] ERROR →", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────
// PATCH /api/crews/[id] — update Crew fields (status, leaveLimits, onboarding)
// ─────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const authz = await authorizeRequest(["crews.edit", "candidates.edit"]);
    if (!authz.ok) return authz.response;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await dbConnect();

    const body = await req.json();
    const update: Record<string, any> = {};

    // ── Crew status
    if ("crewStatus" in body || "crew" in body) {
      const newStatus = String(body.crewStatus || body.crew || "").toLowerCase();
      if ((CREW_STATUSES as readonly string[]).includes(newStatus)) {
        update.crewStatus = newStatus;

        // Keep Candidate.crew in sync for backward compat
        await Candidate.findByIdAndUpdate(id, { $set: { crew: newStatus } });
      }
    }

    // ── Onboarding fields
    if ("onboardDate" in body && body.onboardDate) {
      update.onboardDate = new Date(body.onboardDate);
    }
    if ("onboardPort" in body) update.onboardPort = String(body.onboardPort || "").trim();
    if ("contractStart" in body && body.contractStart) {
      update.contractStart = new Date(body.contractStart);
    }
    if ("contractEnd" in body) {
      update.contractEnd = body.contractEnd ? new Date(body.contractEnd) : undefined;
    }
    if ("contractPeriod" in body) {
      update.contractPeriod = String(body.contractPeriod || "").trim();
    }

    // ── Leave limits
    if ("leaveLimits" in body && Array.isArray(body.leaveLimits)) {
      update.leaveLimits = body.leaveLimits
        .filter((l: any) => l.leaveTypeId && l.maxDays !== undefined)
        .map((l: any) => ({
          leaveTypeId: new mongoose.Types.ObjectId(l.leaveTypeId),
          maxDays: Number(l.maxDays) || 0,
        }));
    }

    if (!Object.keys(update).length) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await Crew.findOneAndUpdate(
      { applicationId: new mongoose.Types.ObjectId(id) },
      { $set: update },
      { new: true },
    );

    if (!updated) {
      return NextResponse.json({ error: "Crew not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PATCH CREW [id] ERROR →", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
