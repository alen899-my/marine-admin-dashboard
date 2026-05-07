import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import Contract from "@/models/Contract";
import Wage from "@/models/Wage";
import {
  assertNoWagePeriodOverlap,
  normalizeWageAllowances,
  toWageDate,
  toWageDateString,
  validateWageTimeline,
} from "@/lib/wageHistory";

function toWageAmount(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Number(parsed.toFixed(2));
}

async function buildScopedContractQuery(
  sessionUser: {
    role?: string;
    company?: { id?: string | null } | null;
  },
  contractId: string,
) {
  const query: Record<string, unknown> = {
    _id: new mongoose.Types.ObjectId(contractId),
    deletedAt: null,
  };

  const isSuperAdmin = sessionUser.role?.toLowerCase() === "super-admin";
  const companyId = sessionUser.company?.id;
  if (!isSuperAdmin) {
    if (!companyId || !mongoose.isValidObjectId(companyId)) {
      throw new Error("Unable to determine company");
    }

    query.company = new mongoose.Types.ObjectId(companyId);
  }

  return query;
}

async function recalculateWageTimeline(contractId: string) {
  const wages = await Wage.find({
    contractId: new mongoose.Types.ObjectId(contractId),
    deletedAt: null,
  }).sort({ effectiveFrom: 1, createdAt: 1 });

  const resolvedTimeline = validateWageTimeline(wages);
  for (const entry of resolvedTimeline) {
    entry.wage.effectiveFrom = entry.effectiveFrom;
    entry.wage.effectiveTo = entry.effectiveTo;
    entry.wage.isCurrent = entry.effectiveTo === null;
    await entry.wage.save();
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authz = await authorizeRequest("contracts.edit");
    if (!authz.ok) return authz.response;

    const session = authz.session;
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid contract reference" }, { status: 400 });
    }

    await dbConnect();

    const contract = await Contract.findOne(
      await buildScopedContractQuery(session.user, id),
    ).lean();
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const body = await req.json();
    const effectiveFrom = toWageDate(
      body.effectiveFrom || contract.commencement || new Date(),
    );
    const normalizedConfiguredEffectiveTo = toWageDateString(body.effectiveTo);
    const configuredEffectiveTo = normalizedConfiguredEffectiveTo
      ? toWageDate(normalizedConfiguredEffectiveTo)
      : null;

    if (
      configuredEffectiveTo &&
      configuredEffectiveTo.getTime() < effectiveFrom.getTime()
    ) {
      return NextResponse.json(
        { error: "End date cannot be before start date" },
        { status: 409 },
      );
    }

    const existingWage = await Wage.findOne({
      contractId: new mongoose.Types.ObjectId(id),
      effectiveFrom,
      deletedAt: null,
    }).lean();
    if (existingWage) {
      return NextResponse.json(
        { error: `Another payscale period already starts on ${toWageDateString(effectiveFrom)}.` },
        { status: 409 },
      );
    }

    const existingWages = await Wage.find({
      contractId: new mongoose.Types.ObjectId(id),
      deletedAt: null,
    }).sort({ effectiveFrom: 1, createdAt: 1 });
    assertNoWagePeriodOverlap({
      wages: existingWages,
      candidate: {
        effectiveFrom,
        configuredEffectiveTo,
      },
    });

    const wage = new Wage({
      company: contract.company,
      contractId: contract._id,
      applicationId: contract.applicationId,
      basic: toWageAmount(body.basic),
      otherAllowance: toWageAmount(body.otherAllowance),
      allowances: normalizeWageAllowances(body.allowances),
      effectiveFrom,
      configuredEffectiveTo,
      effectiveTo: configuredEffectiveTo,
      isCurrent: !configuredEffectiveTo,
    });

    await wage.save();
    await recalculateWageTimeline(id);

    return NextResponse.json({ success: true, wageId: wage._id });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create payscale period";

    return NextResponse.json(
      { error: message },
      { status: message.toLowerCase().includes("not found") ? 404 : 409 },
    );
  }
}
