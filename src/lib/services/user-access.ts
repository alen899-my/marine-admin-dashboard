import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import Role from "@/models/Role";
import UserSession from "@/models/UserSession";

// ─────────────────────────────────────────────────────────────────────────────
// Return shapes
// ─────────────────────────────────────────────────────────────────────────────

export interface UserStatusCount {
  status: string;
  count: number;
}

export interface RoleDistributionItem {
  roleName: string;
  count: number;
}

export interface RecentLoginRow {
  sessionId: string;
  userName: string;
  profilePicture: string | null;
  email: string;
  loginAt: string;
  ip: string | null;
  lastSeenAt: string;
}

export interface UserAccessData {
  statusDistribution: UserStatusCount[];
  roleDistribution: RoleDistributionItem[];
  recentLogins: RecentLoginRow[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Service
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserAccessMetrics(
  user: any,
  selectedCompanyId?: string
): Promise<UserAccessData> {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = user.company?.id || user.company;

  if (!isSuperAdmin && !userCompanyId) throw new Error("No company assigned");

  // Company scoping for User queries
  const userFilter: any = { deletedAt: null };
  if (!isSuperAdmin) {
    userFilter.company = typeof userCompanyId === "string" 
      ? new mongoose.Types.ObjectId(userCompanyId) 
      : userCompanyId;
  } else if (selectedCompanyId && selectedCompanyId !== "all") {
    userFilter.company = typeof selectedCompanyId === "string"
      ? new mongoose.Types.ObjectId(selectedCompanyId)
      : selectedCompanyId;
  }

  // Exclude the "candidate" role from all counts
  const candidateRole = await Role.findOne({
    name: { $regex: /^candidate$/i },
  }).select("_id");
  if (candidateRole) {
    userFilter.role = { $ne: candidateRole._id };
  }

  // ── 1. User Status Distribution ───────────────────────────────────────────
  const statusAgg = await User.aggregate([
    { $match: userFilter },
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const statusDistribution: UserStatusCount[] = statusAgg.map((s: any) => ({
    status: s._id ?? "unknown",
    count: s.count,
  }));

  // ── 2. Role Distribution ──────────────────────────────────────────────────
  const roleAgg = await User.aggregate([
    { $match: userFilter },
    {
      $lookup: {
        from: "roles",
        localField: "role",
        foreignField: "_id",
        as: "roleDoc",
      },
    },
    { $unwind: { path: "$roleDoc", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$roleDoc.name",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const roleDistribution: RoleDistributionItem[] = roleAgg
    .filter((r: any) => r._id && !/^candidate$/i.test(r._id))
    .map((r: any) => ({
      roleName: r._id ?? "Unknown",
      count: r.count,
    }));

  // ── 3. Recent Login Activity (last 10 sessions) ───────────────────────────
  // For non-super-admin: only sessions belonging to users in their company.
  // We can't filter UserSession directly by company so we join via userId.
  const sessions = await UserSession.find({ isValid: true })
    .sort({ loginAt: -1 })
    .limit(isSuperAdmin && (!selectedCompanyId || selectedCompanyId === "all") ? 10 : 50)
    .populate({
      path: "userId",
      select: "fullName email company role profilePicture",
    })
    .lean();

  const recentLogins: RecentLoginRow[] = [];
  for (const s of sessions) {
    const u = (s as any).userId;
    if (!u) continue;

    // Company filter post-join for non-super-admin
    if (!isSuperAdmin) {
      const uCompany = u.company?.toString();
      if (uCompany !== userCompanyId?.toString()) continue;
    } else if (selectedCompanyId && selectedCompanyId !== "all") {
      const uCompany = u.company?.toString();
      if (uCompany !== selectedCompanyId) continue;
    }

    recentLogins.push({
      sessionId: (s as any)._id.toString(),
      userName: u.fullName ?? "Unknown",
      profilePicture: u.profilePicture || null,
      email: u.email ?? "—",
      loginAt: (s as any).loginAt
        ? new Date((s as any).loginAt).toISOString()
        : "",
      ip: (s as any).ip ?? null,
      lastSeenAt: (s as any).lastSeenAt
        ? new Date((s as any).lastSeenAt).toISOString()
        : "",
    });

    if (recentLogins.length >= 10) break;
  }

  return { statusDistribution, roleDistribution, recentLogins };
}
