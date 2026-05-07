import { dbConnect } from "@/lib/db";
import Wage from "@/models/Wage";
import SalaryHead from "@/models/SalaryHead";
import AllowanceDeduction from "@/models/AllowanceDeduction";
import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// Return shapes
// ─────────────────────────────────────────────────────────────────────────────

export interface WageByRankRow {
  rank: string;
  avgBasic: number;
  count: number;
}

export interface SalaryHeadRow {
  id: string;
  title: string;
  periodFrom: string | null;
  periodTo: string | null;
  totalAllowance: number;
  allowanceEntries: { label: string; value: number; type: "amount" | "percent" }[];
  totalDeductions: number;
  deductionEntries: { label: string; value: number; type: "amount" | "percent" }[];
}

export interface AllowanceDeductionCounts {
  allowances: number;
  deductions: number;
}

export interface SalaryInsightsData {
  wageByRank: WageByRankRow[];
  salaryHeads: SalaryHeadRow[];
  catalogCounts: AllowanceDeductionCounts;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Service
// ─────────────────────────────────────────────────────────────────────────────

export async function getSalaryInsightsMetrics(
  user: any,
  selectedCompanyId?: string
): Promise<SalaryInsightsData> {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = user.company?.id || user.company;

  if (!isSuperAdmin && !userCompanyId) throw new Error("No company assigned");

  // Resolve effective company ObjectId for filters
  let companyObjId: mongoose.Types.ObjectId | null = null;
  if (!isSuperAdmin) {
    companyObjId = new mongoose.Types.ObjectId(userCompanyId);
  } else if (selectedCompanyId && selectedCompanyId !== "all") {
    companyObjId = new mongoose.Types.ObjectId(selectedCompanyId);
  }

  const wageCompanyFilter = companyObjId ? { company: companyObjId } : {};
  const salaryHeadCompanyFilter = companyObjId ? { companyId: companyObjId } : {};
  // AllowanceDeduction: company=null means global; company=X means company-specific
  const adCompanyFilter = companyObjId
    ? { $or: [{ company: companyObjId }, { company: null }] }
    : {};

  // ── 1. Average Basic Wage by Rank ─────────────────────────────────────────
  // Wage → $lookup Candidate (applicationId) → group by rank → avg basic
  const wageByRankAgg = await Wage.aggregate([
    {
      $match: {
        ...wageCompanyFilter,
        isCurrent: true,
        deletedAt: null,
        basic: { $gt: 0 },
      },
    },
    {
      $lookup: {
        from: "candidates",
        localField: "applicationId",
        foreignField: "_id",
        as: "candidate",
      },
    },
    { $unwind: { path: "$candidate", preserveNullAndEmptyArrays: false } },
    {
      $group: {
        _id: "$candidate.rank",
        avgBasic: { $avg: "$basic" },
        count: { $sum: 1 },
      },
    },
    { $match: { _id: { $ne: null } } },
    { $sort: { avgBasic: -1 } },
    { $limit: 15 },
  ]);

  const wageByRank: WageByRankRow[] = wageByRankAgg.map((r: any) => ({
    rank: r._id as string,
    avgBasic: Math.round(r.avgBasic),
    count: r.count,
  }));

  // ── 2. Active Salary Heads ─────────────────────────────────────────────────
  const salaryHeadsRaw = await SalaryHead.find({
    ...salaryHeadCompanyFilter,
    status: "active",
    deletedAt: null,
  })
    .select("title periodFrom periodTo totalAllowance totalDeductions allowances deductions")
    .sort({ periodFrom: -1 })
    .limit(20)
    .lean();

  const salaryHeads: SalaryHeadRow[] = salaryHeadsRaw.map((s: any) => ({
    id: s._id.toString(),
    title: s.title,
    periodFrom: s.periodFrom ? new Date(s.periodFrom).toISOString() : null,
    periodTo: s.periodTo ? new Date(s.periodTo).toISOString() : null,
    totalAllowance: s.totalAllowance ?? 0,
    allowanceEntries: (s.allowances || []).map((a: any) => ({
      label: a.label,
      value: a.value,
      type: a.type || "amount",
    })),
    totalDeductions: s.totalDeductions ?? 0,
    deductionEntries: (s.deductions || []).map((d: any) => ({
      label: d.label,
      value: d.value,
      type: d.type || "amount",
    })),
  }));

  // ── 3. Allowance/Deduction Catalog Counts ─────────────────────────────────
  const adCounts = await AllowanceDeduction.aggregate([
    {
      $match: {
        ...adCompanyFilter,
        status: "active",
      },
    },
    { $group: { _id: "$type", count: { $sum: 1 } } },
  ]);

  const catalogCounts: AllowanceDeductionCounts = { allowances: 0, deductions: 0 };
  for (const row of adCounts) {
    if (row._id === "allowance") catalogCounts.allowances = row.count;
    else if (row._id === "deduction") catalogCounts.deductions = row.count;
  }

  return { wageByRank, salaryHeads, catalogCounts };
}
