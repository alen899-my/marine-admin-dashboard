import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Job from "@/models/Job";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const userRole = session.user.role?.toLowerCase() || "";
    const isSuperAdmin = userRole === "super_admin" || userRole === "super-admin";
    const userCompanyId = session.user.company?.id;

    // RBAC: If super_admin, they must provide a companyId in the body.
    // If regular admin, they can ONLY create jobs for their own company.
    let targetCompanyId = body.companyId;

    if (!isSuperAdmin) {
      if (!userCompanyId) {
        return NextResponse.json({ success: false, error: "No company associated with user." }, { status: 403 });
      }
      targetCompanyId = userCompanyId; // Force the target company to be the user's company
    } else {
      if (!targetCompanyId) {
        return NextResponse.json({ success: false, error: "Super Admin must specify a companyId." }, { status: 400 });
      }
    }

    const newJob = new Job({
      title: body.title,
      description: body.description,
      isAccepting: body.isAccepting ?? true,
      deadline: body.deadline ? new Date(body.deadline) : null,
      companyId: targetCompanyId,
      status: body.status || "active",
      createdBy: session.user.id,
    });

    await newJob.save();

    // Automatically generate the localized application link if not provided
    const base = req.nextUrl.origin;
    const generatedLink = `${base}/careers/apply?company=${targetCompanyId}`;
    
    // We add suffix later if needed, but standard link is just company for now, or jobId
    const finalLink = `${generatedLink}&jobId=${newJob._id}`;
    
    newJob.applicationLink = body.applicationLink || finalLink;
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
