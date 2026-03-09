import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Job from "@/models/Job";
import { auth } from "@/auth";

// ── Helper to check if user has access to this job ──
async function checkJobAccess(jobId: string) {
  await dbConnect();
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 };
  }

  const job = await Job.findById(jobId);
  if (!job) {
    return { error: "Job not found", status: 404 };
  }

  const userRole = session.user.role?.toLowerCase() || "";
  const isSuperAdmin = userRole === "super_admin" || userRole === "super-admin";

  // Regular admins can only touch jobs in their own company
  if (!isSuperAdmin) {
    const userCompanyId = session.user.company?.id;
    if (job.companyId.toString() !== userCompanyId) {
      return { error: "Forbidden", status: 403 };
    }
  }

  return { session, job, isSuperAdmin };
}

// ── PUT (Update a Job) ──
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Route handler params in Next.js 15+ are a Promise
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing Job ID" }, { status: 400 });
    }

    const access = await checkJobAccess(id);
    if (access.error) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    }

    const body = await req.json();

    // Prevent non-super-admins from changing the companyId directly
    if (!access.isSuperAdmin && body.companyId) {
       delete body.companyId; 
    }

    const { job, session } = access;

    job.title = body.title ?? job.title;
    job.description = body.description ?? job.description;
    job.applicationLink = body.applicationLink ?? job.applicationLink;
    job.isAccepting = body.isAccepting ?? job.isAccepting;
    
    // Explicit null checks for deadline since `undefined` doesn't overwrite DB values
    if (body.deadline === null || body.deadline === "") {
        job.deadline = null;
    } else if (body.deadline) {
        job.deadline = new Date(body.deadline);
    }
    
    if (body.companyId && access.isSuperAdmin) {
       job.companyId = body.companyId;
    }
    
    job.status = body.status ?? job.status;
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
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing Job ID" }, { status: 400 });
    }

    const access = await checkJobAccess(id);
    if (access.error) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    }

    // Hard delete based on the revised implementation plan
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
