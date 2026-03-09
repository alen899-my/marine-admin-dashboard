import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function resolveCompanyId(id: string, sessionCompanyId?: string): Promise<string | null> {
  if (id === "me") return sessionCompanyId ?? null;
  if (mongoose.isValidObjectId(id)) return id;
  return null;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";

  // Regular admin can only access "me"
  if (!isSuperAdmin && id !== "me") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const companyId = await resolveCompanyId(id, session.user.company?.id);
  if (!companyId) {
    return NextResponse.json({ success: false, error: "Invalid or missing company ID" }, { status: 400 });
  }

  try {
    await dbConnect();
    const company = await Company.findById(companyId)
      .select("name email logo")
      .lean();

    if (!company) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: company,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";

  if (!isSuperAdmin && id !== "me") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const companyId = await resolveCompanyId(id, session.user.company?.id);
  if (!companyId) {
    return NextResponse.json({ success: false, error: "Invalid or missing company ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const update: Record<string, unknown> = { ...body };
    
    // Safety: ensure we don't accidentally allow updating system fields if they were in body
    delete (update as any)._id;
    delete (update as any).createdAt;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    }

    await dbConnect();
    const company = await Company.findByIdAndUpdate(
      companyId,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!company) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: company,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}