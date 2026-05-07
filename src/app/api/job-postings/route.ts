import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Job from "@/models/Job";
import { authorizeRequest } from "@/lib/authorizeRequest";

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize with permission slug
    const authz = await authorizeRequest("jobs.create");
    if (!authz.ok) return authz.response;

    await dbConnect();

    const session = authz.session;
    const userRole = session?.user?.role?.toLowerCase() || "";
    const isSuperAdmin = userRole === "super-admin" || userRole === "super_admin";
    const userCompanyId = session?.user?.company?.id;

    const body = await req.json();

    // 2. Company targeting logic
    let targetCompanyId = body.companyId;

    if (!isSuperAdmin) {
      if (!userCompanyId) {
        return NextResponse.json(
          { success: false, error: "No company associated with user." },
          { status: 403 }
        );
      }
      targetCompanyId = userCompanyId; // Force user's own company
    } else {
      if (!targetCompanyId) {
        return NextResponse.json(
          { success: false, error: "Super Admin must specify a companyId." },
          { status: 400 }
        );
      }
    }
    const existing = await Job.findOne({
      title: { $regex: new RegExp(`^${body.title.trim()}$`, "i") },
      companyId: targetCompanyId,
      deletedAt: null,
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `A job titled "${body.title}" already exists.` },
        { status: 409 }
      );
    }

    // 3. Create Job
    const newJob = new Job({
      title: body.title,
      description: body.description,
      isAccepting: body.isAccepting ?? true,
      deadline: body.deadline ? new Date(body.deadline) : null,
      companyId: targetCompanyId,
      createdBy: session?.user?.id,
    });

    await newJob.save();

    // 4. Generate application link
    const base = req.nextUrl.origin;
    newJob.applicationLink =
      body.applicationLink ||
      `${base}/careers/apply?company=${targetCompanyId}&jobId=${newJob._id}`;

    await newJob.save();

    return NextResponse.json({ success: true, data: newJob }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/job-postings error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}