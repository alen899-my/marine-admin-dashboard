import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import { leaveTypeSchema } from "@/lib/validations/leaveTypeSchema";
import LeaveType from "@/models/LeaveType";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authz = await authorizeRequest("leavetype.view");
    if (!authz.ok) return authz.response;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Leave type ID is required" }, { status: 400 });
    }

    await dbConnect();

    const leaveType = await LeaveType.findById(id).lean();

    if (!leaveType) {
      return NextResponse.json({ error: "Leave type not found" }, { status: 404 });
    }

    return NextResponse.json(leaveType);
  } catch (error: unknown) {
    console.error("GET LEAVE TYPE ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch leave type details" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authz = await authorizeRequest("leavetype.edit");
    if (!authz.ok) return authz.response;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Leave type ID is required" }, { status: 400 });
    }

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

    const leaveType = await LeaveType.findById(id);

    if (!leaveType) {
      return NextResponse.json({ error: "Leave type not found" }, { status: 404 });
    }

    const codeRegex = new RegExp(`^${value.code}$`, "i");
    const existingActive = await LeaveType.findOne({
      code: codeRegex,
      _id: { $ne: id },
      companyId: leaveType.companyId,
    });

    if (existingActive) {
      return NextResponse.json(
        { error: "Another leave type with this code already exists" },
        { status: 409 },
      );
    }

    const updated = await LeaveType.findByIdAndUpdate(
      id,
      { $set: value },
      { new: true, runValidators: true },
    );

    return NextResponse.json(
      { success: true, data: updated },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("PUT LEAVE TYPE ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authz = await authorizeRequest("leavetype.delete");
    if (!authz.ok) return authz.response;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Leave type ID is required" }, { status: 400 });
    }

    await dbConnect();

    const leaveType = await LeaveType.findByIdAndDelete(id);

    if (!leaveType) {
      return NextResponse.json({ error: "Leave type not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: "Leave type deleted permanently" },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("DELETE LEAVE TYPE ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
