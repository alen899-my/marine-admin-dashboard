import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { getCandidateApplications } from "@/lib/services/applicationService";
import { authorizeRequest } from "@/lib/authorizeRequest";
import Candidate from "@/models/Candidate";
import Crew from "@/models/Crew";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// GET /api/onboarding — list accepted candidates not yet having a Crew doc
export async function GET(req: NextRequest) {
  try {
    const authz = await authorizeRequest("onboarding.view");
    if (!authz.ok) return authz.response;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = 50;
    const search = searchParams.get("search") || undefined;
    const jobTitle = searchParams.get("jobTitle") || undefined;

    const user = session.user;
    const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
    const companyId = isSuperAdmin
      ? (searchParams.get("companyId") || undefined)
      : (user.company?.id || undefined);

    // Find applicationIds that already have a Crew document (already onboarded)
    const crewQuery: any = { deletedAt: null };
    if (companyId && mongoose.isValidObjectId(companyId)) {
      crewQuery.company = new mongoose.Types.ObjectId(companyId);
    }
    const existingCrewAppIds = await Crew.find(crewQuery)
      .distinct("applicationId")
      .lean();

    const { data, pagination } = await getCandidateApplications({
      page,
      limit,
      search,
      status: ["accepted", "onboarding_ready"],
      // Exclude candidates that already have a Crew document
      excludeIds: existingCrewAppIds.map((id: any) => String(id)),
      jobTitle,
      companyId,
      user,
    });

    return NextResponse.json({ data, pagination });
  } catch (error: any) {
    console.error("ONBOARDING GET ERROR →", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/onboarding?id=<appId> — add onboarding checklist item to Crew doc
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 });
    }

    await dbConnect();
    const body = await req.json();
    const { text } = body;

    // First verify the candidate exists
    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    if (!text?.trim()) {
      return NextResponse.json({ error: "Checklist item text is required" }, { status: 400 });
    }

    // Find the Crew document for this application
    const crew = await Crew.findOne({ applicationId: new mongoose.Types.ObjectId(id) });

    if (crew) {
      // Write checklist to Crew document
      if (!crew.onboardingChecklist) {
        crew.onboardingChecklist = [];
      }

      crew.onboardingChecklist.push({
        text: text.trim(),
        completed: false,
        createdAt: new Date(),
      } as any);

      await crew.save({ validateBeforeSave: false });
      return NextResponse.json({ success: true, checklist: crew.onboardingChecklist });
    } else {
      // Fallback: write to Candidate (pre-onboard state)
      if (!candidate.onboardingChecklist) {
        candidate.onboardingChecklist = [];
      }

      candidate.onboardingChecklist.push({
        text: text.trim(),
        completed: false,
        createdAt: new Date(),
      } as any);

      // Auto-update status based on checklist completion
      const totalItems = candidate.onboardingChecklist.length;
      const completedItems = candidate.onboardingChecklist.filter(
        (i: any) => i.completed
      ).length;

      if (totalItems > 0 && completedItems === totalItems) {
        if (candidate.status === "accepted") {
          candidate.status = "onboarding_ready";
        }
      } else {
        if (candidate.status === "onboarding_ready") {
          candidate.status = "accepted";
        }
      }

      await candidate.save({ validateBeforeSave: false });
      return NextResponse.json({ success: true, checklist: candidate.onboardingChecklist });
    }
  } catch (error: any) {
    console.error("ONBOARDING POST ERROR →", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/onboarding?id=<appId> — update onboarding checklist
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 });
    }

    await dbConnect();
    const body = await req.json();
    const { action, itemId, completed } = body;

    // Check permissions based on action
    let permission = "onboarding.edit";
    if (action === "add") permission = "onboarding.checklistadding";
    if (action === "delete") permission = "onboarding.delete";

    const authz = await authorizeRequest(permission);
    if (!authz.ok) return authz.response;

    // First verify the candidate exists
    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // Find the Crew document for this application
    const crew = await Crew.findOne({ applicationId: new mongoose.Types.ObjectId(id) });

    if (crew) {
      // Write checklist ops to Crew document
      if (action === "toggle") {
        const item = crew.onboardingChecklist.find(
          (i: any) => i._id.toString() === itemId
        );
        if (!item) {
          return NextResponse.json({ error: "Checklist item not found" }, { status: 404 });
        }
        item.completed = typeof completed === "boolean" ? completed : !item.completed;
      } else if (action === "delete") {
        crew.onboardingChecklist = crew.onboardingChecklist.filter(
          (i: any) => i._id.toString() !== itemId
        ) as any;
      } else {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }

      await crew.save({ validateBeforeSave: false });
      return NextResponse.json({ success: true, checklist: crew.onboardingChecklist });
    } else {
      // Fallback: write to Candidate (pre-onboard state)
      if (action === "toggle") {
        const item = candidate.onboardingChecklist.find(
          (i: any) => i._id.toString() === itemId
        );
        if (!item) {
          return NextResponse.json({ error: "Checklist item not found" }, { status: 404 });
        }
        item.completed = typeof completed === "boolean" ? completed : !item.completed;
      } else if (action === "delete") {
        candidate.onboardingChecklist = candidate.onboardingChecklist.filter(
          (i: any) => i._id.toString() !== itemId
        ) as any;
      } else {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }

      // Auto-update status based on checklist completion
      const totalItems = candidate.onboardingChecklist.length;
      const completedItems = candidate.onboardingChecklist.filter(
        (i: any) => i.completed
      ).length;

      if (totalItems > 0 && completedItems === totalItems) {
        if (candidate.status === "accepted") {
          candidate.status = "onboarding_ready";
        }
      } else {
        if (candidate.status === "onboarding_ready") {
          candidate.status = "accepted";
        }
      }

      await candidate.save({ validateBeforeSave: false });
      return NextResponse.json({ success: true, checklist: candidate.onboardingChecklist });
    }
  } catch (error: any) {
    console.error("ONBOARDING PATCH ERROR →", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
