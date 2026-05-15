import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";
import Document from "@/models/Document";
import ReportDaily from "@/models/ReportDaily";
import ReportOperational from "@/models/ReportOperational";
import Role from "@/models/Role";
import User from "@/models/User";
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage";
import Crew from "@/models/Crew";
import Candidate from "@/models/Candidate";
import Contract from "@/models/Contract";
import Payroll from "@/models/Payroll";
import mongoose from "mongoose";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the start/end boundaries for each of the last N ISO weeks (most recent last). */
function getWeekBoundaries(weeks: number): Array<{ start: Date; end: Date }> {
  const boundaries: Array<{ start: Date; end: Date }> = [];
  const now = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(now.getDate() - i * 7);
    end.setHours(23, 59, 59, 999);

    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    boundaries.push({ start, end });
  }

  return boundaries;
}

/**
 * Compute count difference (growth) from last week.
 * Returns actual number increase/decrease.
 */
function calcTrend(thisWeek: number, lastWeek: number): number {
  return thisWeek - lastWeek;
}

/**
 * Builds a single MongoDB $facet aggregation to count documents per week bucket.
 * Instead of 8 separate countDocuments calls per metric (8 × N metrics = 8N queries),
 * this emits ONE aggregation per model that computes all weekly buckets simultaneously.
 *
 * @param Model   - Mongoose model to aggregate
 * @param baseFilter - Base match filter (status, deletedAt, company, etc.)
 * @param weeks   - Array of { start, end } week boundaries
 * @returns Array of weekly counts aligned to the weeks array (oldest → newest)
 */
async function weeklyFacet(
  Model: any,
  baseFilter: Record<string, any>,
  weeks: Array<{ start: Date; end: Date }>,
): Promise<number[]> {
  // Build facet stages: one branch per week
  const facet: Record<string, any[]> = {};
  weeks.forEach((w, i) => {
    facet[`w${i}`] = [
      { $match: { createdAt: { $gte: w.start, $lte: w.end } } },
      { $count: "n" },
    ];
  });

  const [result] = await Model.aggregate([
    { $match: baseFilter },
    { $facet: facet },
  ]);

  return weeks.map((_, i) => (result?.[`w${i}`]?.[0]?.n ?? 0) as number);
}

/**
 * Custom facet for pending leave count per week.
 */
async function pendingLeaveWeeklyFacet(
  baseFilter: Record<string, any>,
  weeks: Array<{ start: Date; end: Date }>,
): Promise<number[]> {
  const results = await Promise.all(
    weeks.map(async (w) => {
      const count = await Payroll.countDocuments({
        ...baseFilter,
        status: "pending",
        "leaveRequests.isPending": true,
        createdAt: { $gte: w.start, $lte: w.end },
      });
      return count;
    }),
  );
  return results;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function getDashboardMetrics(
  user: any,
  selectedCompanyId?: string,
) {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const isOpStaff = user.role?.toLowerCase() === "op-staff";
  const userCompanyId = user.company?.id || user.company;
  const userId = user.id;

  // ── Base Filters ─────────────────────────────────────────────────────────────
  const filter: any = { status: "active", deletedAt: null };
  const companyFilter: any = { status: "active", deletedAt: null };

  // We need the vessel list and super-admin role in parallel to avoid serial round-trips
  let companyVessels: mongoose.Types.ObjectId[] = [];
  let superAdminRoleId: mongoose.Types.ObjectId | null = null;

  if (!isSuperAdmin) {
    if (!userCompanyId) throw new Error("No company assigned");

    const [vessels, saRole] = await Promise.all([
      isOpStaff
        ? Promise.resolve([] as any[])
        : Vessel.find({
            company: userCompanyId,
            status: "active",
            deletedAt: null,
          }).select("_id"),
      Role.findOne({ name: { $regex: /^super-admin$/i } }).select("_id"),
    ]);

    companyVessels = vessels.map((v: any) => v._id);
    superAdminRoleId = saRole?._id ?? null;

    companyFilter.company = userCompanyId;

    if (isOpStaff) {
      Object.assign(filter, { status: "active", deletedAt: null, createdBy: userId });
    } else {
      Object.assign(filter, {
        status: "active",
        deletedAt: null,
        vesselId: { $in: companyVessels },
      });
    }
  } else if (selectedCompanyId && selectedCompanyId !== "all") {
    const vessels = await Vessel.find({
      company: selectedCompanyId,
      status: "active",
      deletedAt: null,
    }).select("_id");
    companyVessels = vessels.map((v: any) => v._id);
    filter.vesselId = { $in: companyVessels };
    companyFilter.company = selectedCompanyId;
  }

  // ── Company-scoped base filter ────────────────────────────────────────────────
  const scopedCompany =
    isSuperAdmin && (!selectedCompanyId || selectedCompanyId === "all")
      ? {}
      : { company: new mongoose.Types.ObjectId(companyFilter.company) };

  // ── Current Totals — all in one Promise.all ──────────────────────────────────
  const [
    dailyNoon,
    departure,
    arrival,
    nor,
    cargoStowage,
    cargoDocuments,
    totalVessels,
    totalVoyages,
    totalUsers,
    totalCompanies,
    activeCrewCount,
    candidateCount,
    activeContractCount,
    openPayrollCount,
    pendingLeaveResult,
  ] = await Promise.all([
    ReportDaily.countDocuments({ ...filter, type: "noon" }),
    ReportOperational.countDocuments({ ...filter, eventType: "departure" }),
    ReportOperational.countDocuments({ ...filter, eventType: "arrival" }),
    ReportOperational.countDocuments({ ...filter, eventType: "nor" }),
    Document.countDocuments({ ...filter, documentType: "stowage_plan" }),
    Document.countDocuments({ ...filter, documentType: "cargo_documents" }),
    Vessel.countDocuments({ status: "active", deletedAt: null, ...scopedCompany }),
    Voyage.countDocuments({
      status: "active",
      deletedAt: null,
      ...(filter.vesselId ? { vesselId: filter.vesselId } : {}),
      ...(isOpStaff ? { createdBy: userId } : {}),
    }),
    User.countDocuments({
      status: "active",
      deletedAt: null,
      ...scopedCompany,
      ...(!isSuperAdmin && superAdminRoleId ? { role: { $ne: superAdminRoleId } } : {}),
    }),
    Company.countDocuments({
      status: "active",
      deletedAt: null,
      ...(isSuperAdmin && (!selectedCompanyId || selectedCompanyId === "all")
        ? {}
        : { _id: companyFilter.company }),
    }),
    Crew.countDocuments({ crewStatus: "onboard", deletedAt: null, ...scopedCompany }),
    Candidate.countDocuments({ status: { $nin: ["rejected", "onboarded"] }, deletedAt: null, ...scopedCompany }),
    Contract.countDocuments({ contractStatus: "active", deletedAt: null, ...scopedCompany }),
    Payroll.countDocuments({ status: "saved", deletedAt: null, ...scopedCompany }),
    Payroll.aggregate([
      { $match: { status: "saved", deletedAt: null, ...scopedCompany } },
      { $unwind: "$leaveEntries" },
      { $match: { "leaveEntries.status": "pending" } },
      { $count: "total" },
    ]),
  ]);

  const pendingLeaves = pendingLeaveResult[0]?.total || 0;

  // ── Weekly Sparkline Data via $facet (1 aggregation per model, not 8 × N) ────
  const weeks = getWeekBoundaries(8);

  const crewBase = { crewStatus: "onboard", deletedAt: null, ...scopedCompany };
  const candidateBase = { status: { $ne: "rejected" }, deletedAt: null, ...scopedCompany };
  const contractBase = { contractStatus: "active", deletedAt: null, ...scopedCompany };
  const vesselBase = { status: "active", deletedAt: null, ...scopedCompany };
  const voyageBase = {
    status: "active",
    deletedAt: null,
    ...(filter.vesselId ? { vesselId: filter.vesselId } : {}),
    ...(isOpStaff ? { createdBy: userId } : {}),
  };
  const userBase = {
    status: "active",
    deletedAt: null,
    ...scopedCompany,
    ...(!isSuperAdmin && superAdminRoleId ? { role: { $ne: superAdminRoleId } } : {}),
  };
  const companyBase = {
    status: "active",
    deletedAt: null,
    ...(isSuperAdmin && (!selectedCompanyId || selectedCompanyId === "all")
      ? {}
      : { _id: companyFilter.company }),
  };
  const payrollBase = { status: "saved", deletedAt: null, ...scopedCompany };

  // 7 parallel $facet aggregations (one per model), replacing 120 individual queries
  const [
    vesselSpark,
    crewSpark,
    candidateSpark,
    contractSpark,
    voyageSpark,
    userSpark,
    companySpark,
    payrollSpark,
    noonSpark,
    departureSpark,
    arrivalSpark,
    norSpark,
    stowageSpark,
    cargoDocSpark,
    pendingLeaveSpark,
  ] = await Promise.all([
    weeklyFacet(Vessel, vesselBase, weeks),
    weeklyFacet(Crew, crewBase, weeks),
    weeklyFacet(Candidate, candidateBase, weeks),
    weeklyFacet(Contract, contractBase, weeks),
    weeklyFacet(Voyage, voyageBase, weeks),
    weeklyFacet(User, userBase, weeks),
    weeklyFacet(Company, companyBase, weeks),
    weeklyFacet(Payroll, payrollBase, weeks),
    weeklyFacet(ReportDaily, { ...filter, type: "noon" }, weeks),
    weeklyFacet(ReportOperational, { ...filter, eventType: "departure" }, weeks),
    weeklyFacet(ReportOperational, { ...filter, eventType: "arrival" }, weeks),
    weeklyFacet(ReportOperational, { ...filter, eventType: "nor" }, weeks),
    weeklyFacet(Document, { ...filter, documentType: "stowage_plan" }, weeks),
    weeklyFacet(Document, { ...filter, documentType: "cargo_documents" }, weeks),
    pendingLeaveWeeklyFacet(payrollBase, weeks),
  ]);

  // ── Week-over-week trend: this week vs last week ─────────────────────────────
  function spark(arr: number[]) {
    const tw = arr[arr.length - 1];
    const lw = arr[arr.length - 2] ?? 0;
    return { trend: calcTrend(tw, lw), sparkline: arr };
  }

  return {
    // Current totals
    dailyNoon,
    departure,
    arrival,
    nor,
    cargoStowage,
    cargoDocuments,
    vesselCount: totalVessels,
    voyageCount: totalVoyages,
    userCount: totalUsers,
    companyCount: totalCompanies,
    activeCrewCount,
    candidateCount,
    activeContractCount,
    openPayrollCount,
    pendingLeaveCount: pendingLeaves,

    // Trends & sparklines
    vesselTrend: spark(vesselSpark).trend,
    vesselSparkline: vesselSpark,
    crewTrend: spark(crewSpark).trend,
    crewSparkline: crewSpark,
    candidateTrend: spark(candidateSpark).trend,
    candidateSparkline: candidateSpark,
    contractTrend: spark(contractSpark).trend,
    contractSparkline: contractSpark,
    voyageTrend: spark(voyageSpark).trend,
    voyageSparkline: voyageSpark,
    noonTrend: spark(noonSpark).trend,
    noonSparkline: noonSpark,
    departureTrend: spark(departureSpark).trend,
    departureSparkline: departureSpark,
    arrivalTrend: spark(arrivalSpark).trend,
    arrivalSparkline: arrivalSpark,
    norTrend: spark(norSpark).trend,
    norSparkline: norSpark,
    stowageTrend: spark(stowageSpark).trend,
    stowageSparkline: stowageSpark,
    cargoDocTrend: spark(cargoDocSpark).trend,
    cargoDocSparkline: cargoDocSpark,
    payrollTrend: spark(payrollSpark).trend,
    payrollSparkline: payrollSpark,
    pendingLeaveTrend: spark(pendingLeaveSpark).trend,
    pendingLeaveSparkline: pendingLeaveSpark,
    userTrend: spark(userSpark).trend,
    userSparkline: userSpark,
    companyTrend: spark(companySpark).trend,
    companySparkline: companySpark,
  };
}
