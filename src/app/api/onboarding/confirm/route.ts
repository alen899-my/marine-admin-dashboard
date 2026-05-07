import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { authorizeRequest } from "@/lib/authorizeRequest";
import Candidate from "@/models/Candidate";
import Contract from "@/models/Contract";
import Crew from "@/models/Crew";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

async function updateOnboardingDetails(
  req: NextRequest,
  permission: "onboarding.confirm" | "onboarding.edit",
  options?: { activateCrew?: boolean },
) {
  try {
    const authz = await authorizeRequest(permission);
    if (!authz.ok) return authz.response;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const {
      applicationId,
      onboardDate,
      port,
      contractStart,
      contractEnd,
      contractPeriod,
    } = body;

    if (!applicationId || !mongoose.isValidObjectId(applicationId)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 });
    }

    if (!onboardDate || !port || !contractStart) {
      return NextResponse.json(
        { error: "onboardDate, port, and contractStart are required" },
        { status: 400 },
      );
    }

    // ── Build candidate update (backward compat: still write to Candidate)
    const candidateUpdateData: Record<string, Date | string> = {
      onboardDate: new Date(onboardDate),
      onboardPort: port,
      contractStart: new Date(contractStart),
    };

    if (options?.activateCrew) {
      candidateUpdateData.status = "onboarded";
      candidateUpdateData.crew = "onboard";
    }

    if (contractEnd) {
      candidateUpdateData.contractEnd = new Date(contractEnd);
    }
    if (contractPeriod) {
      candidateUpdateData.contractPeriod = contractPeriod;
    }

    const candidate = await Candidate.findByIdAndUpdate(
      applicationId,
      { $set: candidateUpdateData },
      { new: true },
    );

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // ── Build Crew document data
    const crewData: Record<string, any> = {
      applicationId: new mongoose.Types.ObjectId(applicationId),
      company: candidate.company,
      onboardDate: new Date(onboardDate),
      onboardPort: port,
      contractStart: new Date(contractStart),
    };

    if (contractEnd) crewData.contractEnd = new Date(contractEnd);
    if (contractPeriod) crewData.contractPeriod = contractPeriod;

    if (options?.activateCrew) {
      crewData.crewStatus = "onboard";
    }

    // Fetch the latest contract to set contractId on Crew
    const latestContract = await Contract.findOne({
      applicationId: new mongoose.Types.ObjectId(applicationId),
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .select("_id")
      .lean();

    if (latestContract) {
      crewData.contractId = latestContract._id;
    }

    if (options?.activateCrew) {
      // Copy existing checklist and leaveLimits from Candidate → Crew on first creation
      const existingCrew = await Crew.findOne({
        applicationId: new mongoose.Types.ObjectId(applicationId),
      });

      if (!existingCrew) {
        // Brand new Crew doc: migrate checklist + leaveLimits from Candidate
        crewData.onboardingChecklist = candidate.onboardingChecklist ?? [];
      }

      // Upsert Crew document
      await Crew.findOneAndUpdate(
        { applicationId: new mongoose.Types.ObjectId(applicationId) },
        { $set: crewData },
        { upsert: true, new: true },
      );
    } else {
      // PATCH (edit) — just update the onboarding fields on existing Crew
      await Crew.findOneAndUpdate(
        { applicationId: new mongoose.Types.ObjectId(applicationId) },
        {
          $set: {
            onboardDate: crewData.onboardDate,
            onboardPort: crewData.onboardPort,
            contractStart: crewData.contractStart,
            ...(contractEnd ? { contractEnd: crewData.contractEnd } : {}),
            ...(contractPeriod ? { contractPeriod: crewData.contractPeriod } : {}),
            ...(latestContract ? { contractId: latestContract._id } : {}),
          },
        },
        { new: true },
      );
    }

    return NextResponse.json({
      success: true,
      message: options?.activateCrew
        ? `${candidate.firstName} ${candidate.lastName} has been confirmed as onboarded and is now Crew member.`
        : `${candidate.firstName} ${candidate.lastName}'s onboarding details have been updated.`,
      candidateId: candidate._id,
      status: candidate.status,
    });
  } catch (error: unknown) {
    console.error("ONBOARDING CONFIRM ERROR →", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/onboarding/confirm — confirm onboarding and set crew active
export async function POST(req: NextRequest) {
  return updateOnboardingDetails(req, "onboarding.confirm", { activateCrew: true });
}

// PATCH /api/onboarding/confirm — edit onboarding details without changing active status
export async function PATCH(req: NextRequest) {
  return updateOnboardingDetails(req, "onboarding.edit");
}
