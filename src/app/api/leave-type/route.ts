import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import { leaveTypeSchema } from "@/lib/validations/leaveTypeSchema";
import LeaveType from "@/models/LeaveType";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const authz = await authorizeRequest("leavetype.view");
    if (!authz.ok) return authz.response;

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const companyId = searchParams.get("companyId") || "";
    const isDropdown = searchParams.get("limit") === "none";

    // Get user from session for RBAC
    const session = await import("@/auth").then((m) => m.auth());
    const user = session?.user;
    const isSuperAdmin = user?.role?.toLowerCase() === "super-admin";
    const userCompanyId = user?.company?.id;

    // Non-super-admins must have a company
    if (!isSuperAdmin && !userCompanyId) {
      return NextResponse.json({ data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } });
    }

    const query: Record<string, unknown> = {};

    // RBAC: scope to company
    if (!isSuperAdmin) {
      query.companyId = new mongoose.Types.ObjectId(userCompanyId);
    } else if (companyId && mongoose.isValidObjectId(companyId)) {
      query.companyId = new mongoose.Types.ObjectId(companyId);
    }

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { code: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (status !== "all") {
      query.status = status.toLowerCase();
    }

    if (isDropdown) {
      const leaveTypes = await LeaveType.find(query)
        .sort({ name: 1 })
        .select("name code type isCarryForward maxCarryForward maxDays status")
        .lean();

      return NextResponse.json(leaveTypes);
    }

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(searchParams.get("limit")) || 20);
    const skip = (page - 1) * limit;

    const [leaveTypes, total] = await Promise.all([
      LeaveType.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LeaveType.countDocuments(query),
    ]);

    return NextResponse.json({
      data: leaveTypes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error: unknown) {
    console.error("GET LEAVE TYPE ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch leave types" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authz = await authorizeRequest("leavetype.create");
    if (!authz.ok) return authz.response;

    await dbConnect();

    const body = await req.json();

    const { error, value } = leaveTypeSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 },
      );
    }

    // Get user from session for RBAC
    const session = await import("@/auth").then((m) => m.auth());
    const user = session?.user;
    const isSuperAdmin = user?.role?.toLowerCase() === "super-admin";
    const userCompanyId = user?.company?.id;

    // Non-super-admins must have a company
    if (!isSuperAdmin && !userCompanyId) {
      return NextResponse.json({ error: "You do not have a company assigned" }, { status: 403 });
    }

    // For non-superadmins, use their company ID
    const companyId = isSuperAdmin ? value.companyId : userCompanyId;

    if (!companyId) {
      return NextResponse.json({ error: "Company is required" }, { status: 400 });
    }

    if (!mongoose.isValidObjectId(companyId)) {
      return NextResponse.json({ error: "Invalid company ID" }, { status: 400 });
    }

    const codeRegex = new RegExp(`^${value.code}$`, "i");

    const existingActive = await LeaveType.findOne({
      code: codeRegex,
      companyId: companyId,
    });

    if (existingActive) {
      return NextResponse.json(
        { error: "A leave type with this code already exists for this company" },
        { status: 409 },
      );
    }

    const created = await new LeaveType({ ...value, companyId: new mongoose.Types.ObjectId(companyId) }).save();

    return NextResponse.json(
      { success: true, data: created },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("POST LEAVE TYPE ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
