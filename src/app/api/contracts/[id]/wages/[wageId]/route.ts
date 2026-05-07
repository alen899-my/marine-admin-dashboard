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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; wageId: string }> },
) {
  try {
    const authz = await authorizeRequest("contracts.edit");
    if (!authz.ok) return authz.response;

    const session = authz.session;
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, wageId } = await params;
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(wageId)) {
      return NextResponse.json({ error: "Invalid wage reference" }, { status: 400 });
    }

    await dbConnect();

    const contract = await Contract.findOne(
      await buildScopedContractQuery(session.user, id),
    ).lean();
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const wage = await Wage.findOne({
      _id: new mongoose.Types.ObjectId(wageId),
      contractId: new mongoose.Types.ObjectId(id),
      deletedAt: null,
    });
    if (!wage) {
      return NextResponse.json({ error: "Salary record not found" }, { status: 404 });
    }

    const body = await req.json();
    const effectiveFrom = toWageDate(body.effectiveFrom || wage.effectiveFrom);
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

    const existingWages = await Wage.find({
      contractId: new mongoose.Types.ObjectId(id),
      deletedAt: null,
    }).sort({ effectiveFrom: 1, createdAt: 1 });
    assertNoWagePeriodOverlap({
      wages: existingWages,
      candidate: {
        _id: wage._id,
        effectiveFrom,
        configuredEffectiveTo,
      },
      ignoreWageId: String(wage._id),
    });

    wage.basic = toWageAmount(body.basic);

    const otherRaw = body.otherAllowance;
    if (typeof otherRaw === "object" && otherRaw !== null) {
      wage.otherAllowance = {
        value: toWageAmount(otherRaw.value),
        type: otherRaw.type || "amount",
      };
    } else {
      wage.otherAllowance = toWageAmount(otherRaw);
    }

    wage.allowances = normalizeWageAllowances(body.allowances);
    wage.effectiveFrom = effectiveFrom;
    wage.configuredEffectiveTo = configuredEffectiveTo;

    await wage.save();
    await recalculateWageTimeline(id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update salary record";

    return NextResponse.json(
      { error: message },
      { status: message.toLowerCase().includes("not found") ? 404 : 409 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; wageId: string }> },
) {
  try {
    const authz = await authorizeRequest("contracts.delete");
    if (!authz.ok) return authz.response;

    const session = authz.session;
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, wageId } = await params;
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(wageId)) {
      return NextResponse.json({ error: "Invalid wage reference" }, { status: 400 });
    }

    await dbConnect();

    const contract = await Contract.findOne(
      await buildScopedContractQuery(session.user, id),
    ).lean();
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const wage = await Wage.findOne({
      _id: new mongoose.Types.ObjectId(wageId),
      contractId: new mongoose.Types.ObjectId(id),
      deletedAt: null,
    });
    if (!wage) {
      return NextResponse.json({ error: "Salary record not found" }, { status: 404 });
    }

    wage.deletedAt = new Date();
    wage.isCurrent = false;
    await wage.save();
    await recalculateWageTimeline(id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete salary record";

    return NextResponse.json(
      { error: message },
      { status: message.toLowerCase().includes("not found") ? 404 : 409 },
    );
  }
}
