import { dbConnect } from "@/lib/db";
import Contract from "@/models/Contract";
import Vessel from "@/models/Vessel";

// ─────────────────────────────────────────────────────────────────────────────
// parseContractPeriod(str): number of days
// Handles patterns like:
//   "9 Months" | "9 months" | "9M"
//   "3 Weeks"  | "3W"
//   "45 Days"  | "45D"
//   "1 Year"   | "1Y"
//   "9"        → treated as months (maritime convention)
// Returns 0 if unparsable.
// ─────────────────────────────────────────────────────────────────────────────
export function parseContractPeriod(str: string | null | undefined): number {
  if (!str) return 0;
  const s = str.trim().toLowerCase();

  // Match leading number (int or decimal)
  const match = s.match(/^(\d+(?:\.\d+)?)\s*([a-z]*)/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2].replace(/\.$/, ""); // strip trailing dot if any

  if (!unit || unit.startsWith("m")) return Math.round(value * 30.44); // month
  if (unit.startsWith("y")) return Math.round(value * 365.25);         // year
  if (unit.startsWith("w")) return Math.round(value * 7);              // week
  if (unit.startsWith("d")) return Math.round(value);                  // day

  // Fallback — treat bare number as months
  return Math.round(value * 30.44);
}

// ─────────────────────────────────────────────────────────────────────────────
// Return shape
// ─────────────────────────────────────────────────────────────────────────────

export interface ContractTimelineRow {
  contractId: string;
  seafarerName: string;
  profilePhoto: string | null;
  rank: string;
  vesselName: string;
  contractStart: string | null;  // ISO
  contractEnd: string | null;    // ISO (calculated)
  daysRemaining: number;
  /** 0-100 percentage of contract elapsed */
  progress: number;
}

export interface ContractTimelineData {
  rows: ContractTimelineRow[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Service
// ─────────────────────────────────────────────────────────────────────────────

export async function getContractTimelineMetrics(
  user: any,
  selectedCompanyId?: string
): Promise<ContractTimelineData> {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = user.company?.id || user.company;

  if (!isSuperAdmin && !userCompanyId) throw new Error("No company assigned");

  const filter: any = {
    contractStatus: "active",
    deletedAt: null,
    commencement: { $ne: null },    // must have a start date
  };

  if (!isSuperAdmin) {
    filter.company = userCompanyId;
  } else if (selectedCompanyId && selectedCompanyId !== "all") {
    filter.company = selectedCompanyId;
  }

  const contracts = await Contract.find(filter)
    .populate({ path: "vesselId", select: "name" })
    .populate({ path: "applicationId", select: "profilePhoto" })
    .select("seafarerName rank vesselId commencement contractPeriod company applicationId")
    .lean();

  const now = new Date();
  const nowMs = now.getTime();
  const cutoffMs = nowMs + 60 * 24 * 60 * 60 * 1000; // 60 days ahead

  const rows: ContractTimelineRow[] = [];

  for (const c of contracts) {
    const start = c.commencement ? new Date(c.commencement) : null;
    if (!start) continue;

    const startMs = start.getTime();
    const durationDays = parseContractPeriod((c as any).contractPeriod);
    const isFuture = startMs > nowMs;
    
    let endMs: number | null = null;
    let endDate: Date | null = null;
    let daysRemaining = 999;
    let progress = 0;

    if (durationDays > 0) {
      endMs = startMs + durationDays * 24 * 60 * 60 * 1000;
      endDate = new Date(endMs);
      
      if (isFuture) {
        daysRemaining = Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24));
        progress = 0;
      } else {
        daysRemaining = Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24));
        const elapsed = nowMs - startMs;
        const total = endMs - startMs;
        progress = total > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / total) * 100))) : 100;
      }
    }

    rows.push({
      contractId: (c as any)._id.toString(),
      seafarerName: c.seafarerName ?? "Unknown",
      profilePhoto: (c.applicationId as any)?.profilePhoto || null,
      rank: c.rank ?? "—",
      vesselName: (c.vesselId as any)?.name ?? "Unassigned",
      contractStart: start.toISOString(),
      contractEnd: endDate ? endDate.toISOString() : null,
      daysRemaining,
      progress,
    });
  }

  // Sort by days remaining ascending (most urgent first)
  rows.sort((a, b) => a.daysRemaining - b.daysRemaining);

  return { rows };
}
