import { dbConnect } from "@/lib/db";
import { hydrateLeaveTypeRecord } from "@/lib/leaveType.server";
import LeaveType from "@/models/LeaveType";
import Company from "@/models/Company";
import mongoose from "mongoose";

interface GetLeaveTypesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  companyId?: string;
  user?: any;
}

export async function getLeaveTypes({
  page = 1,
  limit = 20,
  search = "",
  status = "all",
  companyId,
  user,
}: GetLeaveTypesParams) {
  await dbConnect();

  const isSuperAdmin = user?.role?.toLowerCase() === "super-admin";
  const userCompanyId = user?.company?.id;

  // Non-super-admins must have a company
  if (!isSuperAdmin && !userCompanyId) {
    return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
  }

  const skip = (page - 1) * limit;
  const query: Record<string, unknown> = {};

  // RBAC: scope to company
  if (!isSuperAdmin) {
    query.companyId = new mongoose.Types.ObjectId(userCompanyId);
  } else if (companyId && mongoose.isValidObjectId(companyId)) {
    query.companyId = new mongoose.Types.ObjectId(companyId);
  }

  if (search.trim()) {
    query.$or = [
      { name: { $regex: search.trim(), $options: "i" } },
      { code: { $regex: search.trim(), $options: "i" } },
    ];
  }

  if (status && status !== "all") {
    query.status = status.toLowerCase();
  }

  const [data, total] = await Promise.all([
    LeaveType.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("companyId", "name")
      .lean(),
    LeaveType.countDocuments(query),
  ]);

  return {
    data: data.map((record) => hydrateLeaveTypeRecord(record)),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getCompaniesForLeaveType(): Promise<{ value: string; label: string }[]> {
  await dbConnect();
  const companies = await Company.find({ status: "active", deletedAt: null })
    .select("_id name")
    .sort({ name: 1 })
    .lean();
  return (companies as any[]).map((c) => ({
    value: c._id.toString(),
    label: c.name,
  }));
}
