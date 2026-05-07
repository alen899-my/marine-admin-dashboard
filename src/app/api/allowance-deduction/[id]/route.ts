import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import { allowanceDeductionSchema } from "@/lib/validations/allowanceDeductionSchema";
import AllowanceDeduction from "@/models/AllowanceDeduction";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authz = await authorizeRequest("allowance.deduction.view");
    if (!authz.ok) return authz.response;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Master ID is required" }, { status: 400 });
    }

    await dbConnect();

    const session = authz.session!;
    const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
    const userCompanyId = session.user.company?.id;
    const query: Record<string, unknown> = { _id: id };

    if (!isSuperAdmin) {
      if (!userCompanyId || !mongoose.isValidObjectId(userCompanyId)) {
        return NextResponse.json(
          { error: "Company assignment is required" },
          { status: 403 },
        );
      }
      query.company = new mongoose.Types.ObjectId(userCompanyId);
    }

    const item = await AllowanceDeduction.findOne(query)
      .populate("company", "name")
      .lean();

    if (!item) {
      return NextResponse.json({ error: "Master not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error: unknown) {
    console.error("GET ALLOWANCE DEDUCTION ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch allowance and deduction master details" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authz = await authorizeRequest("allowance.deduction.edit");
    if (!authz.ok) return authz.response;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Master ID is required" }, { status: 400 });
    }

    await dbConnect();

    const body = await req.json();
    const session = authz.session!;
    const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
    const userCompanyId = session.user.company?.id;
    const companyId = isSuperAdmin ? body.companyId : userCompanyId;

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

    const findQuery: Record<string, unknown> = { _id: id };
    if (!isSuperAdmin) {
      findQuery.company = new mongoose.Types.ObjectId(companyId);
    }

    const item = await AllowanceDeduction.findOne(findQuery);

    if (!item) {
      return NextResponse.json({ error: "Master not found" }, { status: 404 });
    }

    const codeRegex = new RegExp(`^${value.code}$`, "i");
    const existing = await AllowanceDeduction.findOne({
      code: codeRegex,
      type: value.type,
      company: new mongoose.Types.ObjectId(companyId),
      _id: { $ne: id },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Another master with this code and type already exists" },
        { status: 409 },
      );
    }

    const updated = await AllowanceDeduction.findByIdAndUpdate(
      id,
      { $set: { ...value, company: new mongoose.Types.ObjectId(companyId) } },
      { new: true, runValidators: true },
    );

    return NextResponse.json(
      { success: true, data: updated },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("PUT ALLOWANCE DEDUCTION ERROR:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          error:
            "Another master with this code and type already exists for this company",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authz = await authorizeRequest("allowance.deduction.delete");
    if (!authz.ok) return authz.response;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Master ID is required" }, { status: 400 });
    }

    await dbConnect();

    const session = authz.session!;
    const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
    const userCompanyId = session.user.company?.id;
    const query: Record<string, unknown> = { _id: id };

    if (!isSuperAdmin) {
      if (!userCompanyId || !mongoose.isValidObjectId(userCompanyId)) {
        return NextResponse.json(
          { error: "Company assignment is required" },
          { status: 403 },
        );
      }
      query.company = new mongoose.Types.ObjectId(userCompanyId);
    }

    const item = await AllowanceDeduction.findOneAndDelete(query);

    if (!item) {
      return NextResponse.json({ error: "Master not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: "Master deleted permanently" },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("DELETE ALLOWANCE DEDUCTION ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
