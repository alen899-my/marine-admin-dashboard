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

export async function GET(req: NextRequest) {
  try {
    const authz = await authorizeRequest("salary.head.view");
    if (!authz.ok) return authz.response;

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const companyIdParam = searchParams.get("companyId") || "";
    const isDropdown = searchParams.get("limit") === "none";

    const session = authz.session!;
    const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
    const userCompanyId = session.user.company?.id;

    const query: Record<string, unknown> = { deletedAt: null };

    if (!isSuperAdmin) {
      if (!userCompanyId) {
        return NextResponse.json({ error: "Company assignment required" }, { status: 403 });
      }
      query.companyId = userCompanyId;
    } else if (companyIdParam && companyIdParam !== "all") {
      query.companyId = companyIdParam;
    }

    if (search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (status !== "all") {
      query.status = status.toLowerCase();
    }

    if (isDropdown) {
      const salaryHeads = await SalaryHead.find(query)
        .sort({ title: 1 })
        .select("title status companyId")
        .populate("companyId", "name")
        .lean();

      return NextResponse.json(salaryHeads);
    }

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(searchParams.get("limit")) || 20);
    const skip = (page - 1) * limit;

    const [salaryHeads, total] = await Promise.all([
      SalaryHead.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("companyId", "name")
        .select(
          "title description periodFrom periodTo otherAllowance allowances totalAllowance deductions bondedStore cashAdvance telDeduction otherDeductions totalDeductions status createdAt updatedAt companyId",
        )
        .lean(),
      SalaryHead.countDocuments(query),
    ]);

    return NextResponse.json({
      data: salaryHeads.map((salaryHead) => hydrateSalaryHeadRecord(salaryHead)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error: unknown) {
    console.error("GET SALARY HEAD ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch salary heads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authz = await authorizeRequest("salary.head.create");
    if (!authz.ok) return authz.response;

    await dbConnect();

    const body = await req.json();
    const session = authz.session!;
    const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
    
    // Normal users must use their own company; Super Admin can choose
    const finalCompanyId = isSuperAdmin ? body.companyId : session.user.company?.id;

    if (!finalCompanyId) {
      return NextResponse.json({ error: "Company is required" }, { status: 400 });
    }

    const preparedPayload = {
      ...body,
      companyId: finalCompanyId,
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

    const titleRegex = new RegExp(`^${value.title}$`, "i");

    const existingActive = await SalaryHead.findOne({
      companyId: value.companyId,
      title: titleRegex,
      deletedAt: null,
    });

    if (existingActive) {
      return NextResponse.json(
        { error: "A salary head with this title already exists" },
        { status: 409 },
      );
    }

    const payload = {
      ...value,
      totalAllowance: computeSalaryHeadAllowanceTotal(value),
      totalDeductions: computeSalaryHeadDeductions(value),
      otherAllowance: 0,
      bondedStore: 0,
      cashAdvance: 0,
      telDeduction: 0,
      otherDeductions: 0,
      deletedAt: null,
    };

    const deletedSalaryHead = await SalaryHead.findOne({
      companyId: value.companyId,
      title: titleRegex,
      deletedAt: { $ne: null },
    });

    if (deletedSalaryHead) {
      const restored = await SalaryHead.findByIdAndUpdate(
        deletedSalaryHead._id,
        {
          ...payload,
          deletedAt: null,
        },
        { new: true },
      );

      return NextResponse.json(
        {
          success: true,
          message: "Existing salary head restored from trash",
          data: restored,
        },
        { status: 200 },
      );
    }

    const created = await new SalaryHead(payload).save();

    return NextResponse.json(
      { success: true, data: hydrateSalaryHeadRecord(created) },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("POST SALARY HEAD ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
