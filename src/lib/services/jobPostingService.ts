import { dbConnect } from "@/lib/db";
import Job from "@/models/Job";
import Company from "@/models/Company";
import mongoose from "mongoose";

interface GetJobPostingsParams {
  page?: number;
  limit?: number;
  search?: string;
  isAccepting?: string;
  companyId?: string;
  user: any;
}

export async function getJobPostings({
  page = 1,
  limit = 10,
  search = "",
  isAccepting,
  companyId,
  user,
}: GetJobPostingsParams) {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = user.company?.id;
  const skip = (page - 1) * limit;

  // Non-super-admins must have a company
  if (!isSuperAdmin && !userCompanyId) {
    return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
  }

  const query: any = {};

  // RBAC: scope to company
  if (!isSuperAdmin) {
    query.companyId = new mongoose.Types.ObjectId(userCompanyId);
  } else if (companyId && mongoose.isValidObjectId(companyId)) {
    query.companyId = new mongoose.Types.ObjectId(companyId);
  }

  // isAccepting filter
  if (isAccepting === "true") {
    query.isAccepting = true;
  } else if (isAccepting === "false") {
    query.isAccepting = false;
  }

  // Search filter
 if (search.trim()) {
  const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  query.title = { $regex: escaped, $options: "i" };
}

  const [data, total] = await Promise.all([
    Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("companyId", "name")
      .lean(),
    Job.countDocuments(query),
  ]);

  return {
    data: JSON.parse(JSON.stringify(data)),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getCompaniesForJobPostings(): Promise<{ value: string; label: string }[]> {
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