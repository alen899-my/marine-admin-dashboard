import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import { allowanceDeductionSchema } from "@/lib/validations/allowanceDeductionSchema";
import AllowanceDeduction from "@/models/AllowanceDeduction";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const authz = await authorizeRequest([
      "allowance.deduction.view",
      "salary.head.view",
      "salary.head.create",
      "salary.head.edit",
      "contracts.view",
      "contracts.create",
      "contracts.edit",
      "crews.view",
      "crews.edit",
      "payroll.view",
      "payroll.create",
      "payroll.edit",
    ]);
    if (!authz.ok) return authz.response;

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all";
    const status = searchParams.get("status") || "all";
    const companyIdParam = searchParams.get("companyId") || "";
    const isDropdown = searchParams.get("limit") === "none";
    const session = authz.session!;
    const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
    const userCompanyId = session.user.company?.id;

    const query: Record<string, unknown> = {};

    if (!isSuperAdmin) {
      if (!userCompanyId || !mongoose.isValidObjectId(userCompanyId)) {
        return NextResponse.json(
          { error: "Company assignment is required" },
          { status: 403 },
        );
      }
      query.company = new mongoose.Types.ObjectId(userCompanyId);
    } else if (
      companyIdParam &&
      companyIdParam !== "all" &&
      mongoose.isValidObjectId(companyIdParam)
    ) {
      query.company = new mongoose.Types.ObjectId(companyIdParam);
    }

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { code: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (type !== "all") {
      query.type = type.toLowerCase();
    }

    if (status !== "all") {
      query.status = status.toLowerCase();
    }

    if (isDropdown) {
      const items = await AllowanceDeduction.find(query)
        .sort({ type: 1, name: 1 })
        .select("name code type description status company")
        .populate("company", "name")
        .lean();

      return NextResponse.json(items);
    }

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(searchParams.get("limit")) || 20);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AllowanceDeduction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AllowanceDeduction.countDocuments(query),
    ]);

    return NextResponse.json({
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error: unknown) {
    console.error("GET ALLOWANCE DEDUCTION ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch allowance and deduction masters" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authz = await authorizeRequest("allowance.deduction.create");
    if (!authz.ok) return authz.response;

    await dbConnect();

    const body = await req.json();
    const session = authz.session!;
    const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
    const companyId = isSuperAdmin ? body.companyId : session.user.company?.id;

    if (!companyId || !mongoose.isValidObjectId(companyId)) {
      return NextResponse.json(
        { error: "A valid company is required" },
        { status: 400 },
      );
    }

    const { error, value } = allowanceDeductionSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 },
      );
    }

    const codeRegex = new RegExp(`^${value.code}$`, "i");
    const existing = await AllowanceDeduction.findOne({
      code: codeRegex,
      type: value.type,
      company: new mongoose.Types.ObjectId(companyId),
    });

    if (existing) {
      return NextResponse.json(
        { error: "A master with this code and type already exists" },
        { status: 409 },
      );
    }

    const created = await new AllowanceDeduction({
      ...value,
      company: new mongoose.Types.ObjectId(companyId),
    }).save();

    return NextResponse.json(
      { success: true, data: created },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("POST ALLOWANCE DEDUCTION ERROR:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { error: "A master with this code and type already exists for this company" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
