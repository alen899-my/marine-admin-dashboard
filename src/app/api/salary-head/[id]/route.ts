import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import {
  computeSalaryHeadAllowanceTotal,
  computeSalaryHeadDeductions,
  normalizeSalaryHeadAllowances,
  normalizeSalaryHeadDeductions,
  hydrateSalaryHeadRecord,
} from "@/lib/salaryHead.server";
import { salaryHeadSchema } from "@/lib/validations/salaryHeadSchema";
import SalaryHead from "@/models/SalaryHead";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authz = await authorizeRequest("salary.head.view");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const { id } = await params;

    const salaryHead = await SalaryHead.findOne({
      _id: id,
      deletedAt: null,
    }).lean();

    if (!salaryHead) {
      return NextResponse.json({ error: "Salary head not found" }, { status: 404 });
    }

    return NextResponse.json({ data: hydrateSalaryHeadRecord(salaryHead) });
  } catch (error: unknown) {
    console.error("GET SALARY HEAD BY ID ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch salary head" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authz = await authorizeRequest("salary.head.edit");
    if (!authz.ok) return authz.response;

    await dbConnect();

    const { id } = await params;
    const body = await req.json();
    const preparedPayload = {
      ...body,
      allowances: normalizeSalaryHeadAllowances(body),
      deductions: normalizeSalaryHeadDeductions(body.deductions ?? body),
    };

    const { error, value } = salaryHeadSchema.validate(preparedPayload, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 },
      );
    }

    const duplicate = await SalaryHead.findOne({
      companyId: value.companyId,
      title: { $regex: new RegExp(`^${value.title}$`, "i") },
      _id: { $ne: id },
      deletedAt: null,
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "Another salary head with this title already exists" },
        { status: 409 },
      );
    }

    const updated = await SalaryHead.findByIdAndUpdate(
      id,
      {
        $set: {
          ...value,
          totalAllowance: computeSalaryHeadAllowanceTotal(value),
          totalDeductions: computeSalaryHeadDeductions(value),
          otherAllowance: 0,
          bondedStore: 0,
          cashAdvance: 0,
          telDeduction: 0,
          otherDeductions: 0,
        },
      },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return NextResponse.json({ error: "Salary head not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: hydrateSalaryHeadRecord(updated) });
  } catch (error: unknown) {
    console.error("PATCH SALARY HEAD ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update salary head" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authz = await authorizeRequest("salary.head.delete");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const { id } = await params;

    const deleted = await SalaryHead.findByIdAndDelete(
      id
      
    );

    if (!deleted) {
      return NextResponse.json({ error: "Salary head not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Salary head moved to trash",
    });
  } catch (error: unknown) {
    console.error("DELETE SALARY HEAD ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete salary head" },
      { status: 500 },
    );
  }
}
