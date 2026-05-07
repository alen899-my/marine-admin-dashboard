import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Candidate from "@/models/Candidate";
import Contract from "@/models/Contract";
import Crew from "@/models/Crew";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/seed/migrate-crews
 *
 * One-time migration: Creates Crew documents for all existing onboarded candidates
 * that don't already have a corresponding Crew record.
 *
 * Run this ONCE after deploying the Crew schema separation.
 * Safe to re-run — it skips candidates that already have a Crew doc (upsert).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow super admins to run migration
    const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden — super admin only" }, { status: 403 });
    }

    await dbConnect();

    // Find all onboarded candidates
    const onboardedCandidates = await Candidate.find({
      status: "onboarded",
      deletedAt: null,
    })
      .select(
        "_id company crew onboardDate onboardPort contractStart contractEnd contractPeriod onboardingChecklist leaveLimits"
      )
      .lean();

    if (!onboardedCandidates.length) {
      return NextResponse.json({
        success: true,
        message: "No onboarded candidates found. Nothing to migrate.",
        migrated: 0,
        skipped: 0,
      });
    }

    // Fetch latest contracts for all these candidates
    const applicationIds = onboardedCandidates.map((c: any) => c._id);
    const contracts = await Contract.find({
      applicationId: { $in: applicationIds },
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .select("_id applicationId")
      .lean();

    // Build a map of applicationId → latest contractId
    const contractMap = new Map<string, mongoose.Types.ObjectId>();
    for (const c of contracts as any[]) {
      const key = String(c.applicationId);
      if (!contractMap.has(key)) {
        contractMap.set(key, c._id);
      }
    }

    let migrated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const candidate of onboardedCandidates as any[]) {
      try {
        const appId = String(candidate._id);
        const contractId = contractMap.get(appId) || null;

        const crewData: any = {
          applicationId: candidate._id,
          company: candidate.company,
          contractId,
          crewStatus: candidate.crew || "onboard",
          onboardingChecklist: candidate.onboardingChecklist || [],
          leaveLimits: candidate.leaveLimits || [],
        };

        if (candidate.onboardDate) crewData.onboardDate = candidate.onboardDate;
        if (candidate.onboardPort) crewData.onboardPort = candidate.onboardPort;
        if (candidate.contractStart) crewData.contractStart = candidate.contractStart;
        if (candidate.contractEnd) crewData.contractEnd = candidate.contractEnd;
        if (candidate.contractPeriod) crewData.contractPeriod = candidate.contractPeriod;

        const result = await Crew.findOneAndUpdate(
          { applicationId: candidate._id },
          { $setOnInsert: crewData },
          { upsert: true, new: true },
        );

        if (result) {
          migrated++;
        } else {
          skipped++;
        }
      } catch (err: any) {
        errors.push(`${candidate._id}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration complete. ${migrated} Crew documents created, ${skipped} skipped.`,
      migrated,
      skipped,
      errors: errors.length ? errors : undefined,
    });
  } catch (error: any) {
    console.error("CREW MIGRATION ERROR →", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
