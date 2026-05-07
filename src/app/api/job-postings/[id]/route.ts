import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Job from "@/models/Job";
import { authorizeRequest } from "@/lib/authorizeRequest";

// ── PUT (Update a Job) ──
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeRequest("jobs.edit");
    if (!authz.ok) return authz.response;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing Job ID" }, { status: 400 });
    }

    await dbConnect();

    const session = authz.session;
    const userRole = session?.user?.role?.toLowerCase() || "";
    const isSuperAdmin = userRole === "super-admin" || userRole === "super_admin";
    const userCompanyId = session?.user?.company?.id;

    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    // Regular users can only touch jobs in their own company
    if (!isSuperAdmin && job.companyId.toString() !== userCompanyId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Prevent non-super-admins from changing companyId
    if (!isSuperAdmin && body.companyId) {
      delete body.companyId;
    }

    job.title = body.title ?? job.title;
    job.description = body.description ?? job.description;
    job.applicationLink = body.applicationLink ?? job.applicationLink;
    job.isAccepting = body.isAccepting ?? job.isAccepting;

    if (body.deadline === null || body.deadline === "") {
      job.deadline = null;
    } else if (body.deadline) {
      job.deadline = new Date(body.deadline);
    }

    if (body.companyId && isSuperAdmin) {
      job.companyId = body.companyId;
    }

    job.updatedBy = session?.user?.id;

    await job.save();
    return NextResponse.json({ success: true, data: job }, { status: 200 });
  } catch (error: any) {
    console.error("PUT /api/job-postings/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ── DELETE (Hard Delete a Job) ──
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeRequest("jobs.delete");
    if (!authz.ok) return authz.response;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing Job ID" }, { status: 400 });
    }

    await dbConnect();

    const session = authz.session;
    const userRole = session?.user?.role?.toLowerCase() || "";
    const isSuperAdmin = userRole === "super-admin" || userRole === "super_admin";
    const userCompanyId = session?.user?.company?.id;

    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    // Regular users can only delete jobs in their own company
    if (!isSuperAdmin && job.companyId.toString() !== userCompanyId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await Job.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Job deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE /api/job-postings/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}