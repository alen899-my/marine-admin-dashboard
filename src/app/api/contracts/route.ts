import { auth } from "@/auth";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import {
  assertNoWagePeriodOverlap,
  areWageSnapshotsEqual,
  normalizeWageAllowances,
  pickLatestWage,
  toWageDate,
  toWageDateString,
  validateWageTimeline,
} from "@/lib/wageHistory";
import Contract from "@/models/Contract";
import Candidate from "@/models/Candidate";
import Crew from "@/models/Crew";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

function buildWageSnapshot(input: {
  basic?: unknown;
  otherAllowance?: unknown;
  allowances?: unknown;
}) {
  let otherAllowance: any = Number(input.otherAllowance) || 0;

  if (
    typeof input.otherAllowance === "object" &&
    input.otherAllowance !== null
  ) {
    const rawOther = input.otherAllowance as any;
    otherAllowance = {
      value: Number(rawOther.value) || 0,
      type: rawOther.type || "amount",
    };
  }

  return {
    basic: Number(input.basic) || 0,
    otherAllowance,
    allowances: normalizeWageAllowances(input.allowances),
  };
}

async function ensureWageIndexes(Wage: any) {
  try {
    await Wage.collection.dropIndex("contractId_1");
  } catch (error: any) {
    if (error?.codeName !== "IndexNotFound") {
      console.warn("WAGE INDEX CLEANUP WARNING →", error?.message || error);
    }
  }
}

async function syncWageTimeline<
  T extends {
    effectiveFrom?: string | Date | null;
    effectiveTo?: string | Date | null;
    configuredEffectiveTo?: string | Date | null;
    createdAt?: string | Date | null;
    isCurrent?: boolean;
    save: () => Promise<unknown>;
  },
>(wages: T[]) {
  const resolvedTimeline = validateWageTimeline(wages);

  for (const entry of resolvedTimeline) {
    entry.wage.effectiveFrom = entry.effectiveFrom;
    entry.wage.effectiveTo = entry.effectiveTo;
    entry.wage.isCurrent = entry.effectiveTo === null;
    await entry.wage.save();
  }
}

// ─────────────────────────────────────────────
// POST /api/contracts — Create a new contract
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const authz = await authorizeRequest("contracts.create");
    if (!authz.ok) return authz.response;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();

    const {
      applicationId,
      seafarerName,
      seafarerEmail,
      rank,
      positionApplied,
      cdcNo,
      indosNo,
      vesselId,
      portOfJoining,
      commencement,
      contractStart,
      contractEnd,
      contractPeriod,
      wages,
      wageEffectiveFrom,
      wageEffectiveTo,
      isDraft,
      contractId,
      signDate,
      signPlace,
      referenceNo,
    } = body;

    // ── Validation
    if (!applicationId || !seafarerName) {
      return NextResponse.json(
        { error: "Application ID and Seafarer Name are required" },
        { status: 400 }
      );
    }
    
    if (!isDraft) {
      if (!cdcNo || !indosNo || !portOfJoining || !commencement || !contractPeriod || !wages?.basic) {
        return NextResponse.json(
          { error: "Missing required fields for generating a contract" },
          { status: 400 }
        );
      }
    }

    const companyId =
      session.user.role?.toLowerCase() === "super-admin"
        ? body.companyId
        : session.user.company?.id;

    if (!companyId) {
      return NextResponse.json(
        { error: "Unable to determine company" },
        { status: 400 }
      );
    }

    // ── Update or Create Contract
    const query = contractId ? { _id: contractId } : { applicationId, company: companyId };
    const existingContract = await Contract.findOne(query);
    
let finalStatus = isDraft ? "draft" : "generated";
    
    if (isDraft && (existingContract?.contractStatus === "generated" || existingContract?.contractStatus === "active")) {
        finalStatus = existingContract.contractStatus;
    }

    if (!isDraft && existingContract?.contractStatus === "active") {
        finalStatus = "active";
    }

    const contract = await Contract.findOneAndUpdate(
      query,
      {
        company: companyId,
        applicationId,
        seafarerName,
        seafarerEmail: seafarerEmail || "",
        rank: rank || "",
        positionApplied: positionApplied || "",
        cdcNo: cdcNo || "",
        indosNo: indosNo || "",
        vesselId: vesselId || null,
        portOfJoining: portOfJoining || "",
        commencement: commencement ? new Date(commencement) : undefined,
        contractStart: contractStart ? new Date(contractStart) : undefined,
        contractEnd: contractEnd ? new Date(contractEnd) : undefined,
        contractPeriod: contractPeriod || "",
        signDate: signDate ? new Date(signDate) : undefined,
        signPlace: signPlace || "",
        referenceNo: referenceNo || "",
        contractStatus: finalStatus,
      },
      { upsert: true, new: true }
    );

    // ── Update or Create Wage
    const Wage = (await import("@/models/Wage")).default;
    await ensureWageIndexes(Wage);

    const nextWage = buildWageSnapshot(wages || {});
    const requestedEffectiveFrom = toWageDate(
      wageEffectiveFrom || commencement || existingContract?.commencement || new Date(),
    );
    const normalizedEffectiveTo = toWageDateString(wageEffectiveTo);
    const requestedEffectiveTo = normalizedEffectiveTo
      ? toWageDate(normalizedEffectiveTo)
      : null;

    if (
      requestedEffectiveTo &&
      requestedEffectiveTo.getTime() < requestedEffectiveFrom.getTime()
    ) {
      return NextResponse.json(
        {
          error:
            "Salary effective end date cannot be before the effective start date.",
        },
        { status: 409 },
      );
    }

    const existingWages = await Wage.find({
      contractId: contract._id,
      deletedAt: null,
    }).sort({ effectiveFrom: 1, createdAt: 1 });
    const currentWage = pickLatestWage(existingWages);
    const hasMeaningfulWageInput =
      nextWage.basic > 0 ||
      nextWage.otherAllowance > 0 ||
      nextWage.allowances.length > 0;

    if (!currentWage && !hasMeaningfulWageInput) {
      return NextResponse.json(
        { success: true, contractId: contract._id },
        { status: 201 },
      );
    }

    if (!currentWage) {
      assertNoWagePeriodOverlap({
        wages: existingWages,
        candidate: {
          effectiveFrom: requestedEffectiveFrom,
          configuredEffectiveTo: requestedEffectiveTo,
        },
      });
      existingWages.push(
        new Wage({
          company: companyId,
          contractId: contract._id,
          applicationId,
          ...nextWage,
          effectiveFrom: requestedEffectiveFrom,
          configuredEffectiveTo: requestedEffectiveTo,
          effectiveTo: requestedEffectiveTo,
          isCurrent: !requestedEffectiveTo,
        }),
      );
    } else {
      const currentEffectiveFrom = toWageDate(
        currentWage.effectiveFrom || currentWage.createdAt || commencement || new Date(),
      );
      const requestedEffectiveKey = toWageDateString(requestedEffectiveFrom);
      const currentEffectiveKey = toWageDateString(currentEffectiveFrom);
      const sameWage = areWageSnapshotsEqual(currentWage, nextWage);

      if (sameWage || requestedEffectiveKey === currentEffectiveKey) {
        assertNoWagePeriodOverlap({
          wages: existingWages,
          candidate: {
            _id: (currentWage as any)._id,
            effectiveFrom: requestedEffectiveFrom,
            configuredEffectiveTo: requestedEffectiveTo,
          },
          ignoreWageId: String((currentWage as any)._id || ""),
        });
        currentWage.company = companyId;
        currentWage.applicationId = applicationId;
        currentWage.basic = nextWage.basic;
        currentWage.otherAllowance = nextWage.otherAllowance;
        currentWage.allowances = nextWage.allowances;
        currentWage.effectiveFrom = requestedEffectiveFrom;
        currentWage.configuredEffectiveTo = requestedEffectiveTo;
      } else {
        assertNoWagePeriodOverlap({
          wages: existingWages,
          candidate: {
            effectiveFrom: requestedEffectiveFrom,
            configuredEffectiveTo: requestedEffectiveTo,
          },
        });
        existingWages.push(
          new Wage({
            company: companyId,
            contractId: contract._id,
            applicationId,
            ...nextWage,
            effectiveFrom: requestedEffectiveFrom,
            configuredEffectiveTo: requestedEffectiveTo,
            effectiveTo: requestedEffectiveTo,
            isCurrent: !requestedEffectiveTo,
          }),
        );
      }
    }

    await syncWageTimeline(existingWages);

    // ── Update Crew.contractId to point to the latest contract
    await Crew.findOneAndUpdate(
      { applicationId: new mongoose.Types.ObjectId(applicationId) },
      { $set: { contractId: contract._id } },
    );

    return NextResponse.json(
      { success: true, contractId: contract._id },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create contract";

    console.error("CREATE CONTRACT ERROR →", error);
    return NextResponse.json(
      { error: message },
      {
        status:
          message.toLowerCase().includes("salary") ||
          message.toLowerCase().includes("already starts")
            ? 409
            : 500,
      },
    );
  }
}

// ─────────────────────────────────────────────
// GET /api/contracts — List contracts
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const authz = await authorizeRequest("contracts.view");
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

    const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
    const companyId = isSuperAdmin
      ? searchParams.get("companyId")
      : session.user.company?.id;

    const query: any = { deletedAt: null };
    if (companyId && !["all", "undefined", "null"].includes(companyId)) {
      query.company = companyId;
    }

    const [contracts, total] = await Promise.all([
      Contract.find(query)
        .populate("vesselId", "name _id")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Contract.countDocuments(query),
    ]);

    const contractIds = contracts.map((c: any) => c._id);
    const Wage = (await import("@/models/Wage")).default;
    const wages = await Wage.find({
      contractId: { $in: contractIds },
      deletedAt: null,
    })
      .sort({ effectiveFrom: -1, createdAt: -1 })
      .lean();
    const wagesMap = wages.reduce((acc: any, wage: any) => {
      const key = String(wage.contractId);
      acc[key] = acc[key] || [];
      acc[key].push(wage);
      return acc;
    }, {});

    const populatedContracts = contracts.map((c: any) => ({
      ...c,
      wages: pickLatestWage(wagesMap[String(c._id)] || []),
      wagesHistory: wagesMap[String(c._id)] || [],
    }));

    return NextResponse.json({
      data: populatedContracts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET CONTRACTS ERROR →", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────
// PATCH /api/contracts — Mark as sent (update candidate status)
// ─────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const authz = await authorizeRequest("contracts.edit");
    if (!authz.ok) return authz.response;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { applicationId, action } = body;

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    if (action === "unsent") {
      await Candidate.findByIdAndUpdate(applicationId, {
        status: "selected",
      });

      return NextResponse.json(
        { success: true, message: "Candidate status reverted to Selected" },
        { status: 200 }
      );
    }

    await Candidate.findByIdAndUpdate(applicationId, {
      status: "offer_sea_issued",
    });

    return NextResponse.json(
      { success: true, message: "Candidate status updated to Offer/SEA Issued" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("MARK AS SENT ERROR →", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
