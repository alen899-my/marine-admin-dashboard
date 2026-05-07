import { hydrateAllowanceDeductionRecord } from "@/lib/allowanceDeduction.server";
import { dbConnect } from "@/lib/db";
import AllowanceDeduction from "@/models/AllowanceDeduction";
import Company from "@/models/Company";
import mongoose from "mongoose";

interface GetAllowanceDeductionsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
  companyId?: string;
  user?: any;
}

export async function getAllowanceDeductions({
  page = 1,
  limit = 20,
  search = "",
  type = "all",
  status = "all",
  companyId = "",
  user,
}: GetAllowanceDeductionsParams) {
  await dbConnect();

  const skip = (page - 1) * limit;
  const query: Record<string, unknown> = {};
  const isSuperAdmin = user?.role?.toLowerCase() === "super-admin";
  const userCompanyId = user?.company?.id;

  if (!isSuperAdmin) {
    if (!userCompanyId || !mongoose.isValidObjectId(userCompanyId)) {
      return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    }

    query.company = new mongoose.Types.ObjectId(userCompanyId);
  } else if (companyId && companyId !== "all" && mongoose.isValidObjectId(companyId)) {
    query.company = new mongoose.Types.ObjectId(companyId);
  }

  if (search.trim()) {
    query.$or = [
      { name: { $regex: search.trim(), $options: "i" } },
      { code: { $regex: search.trim(), $options: "i" } },
    ];
  }

  if (type && type !== "all") {
    query.type = type.toLowerCase();
  }

  if (status && status !== "all") {
    query.status = status.toLowerCase();
  }

  const [data, total] = await Promise.all([
    AllowanceDeduction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("company", "name")
      .lean(),
    AllowanceDeduction.countDocuments(query),
  ]);

  return {
    data: data.map((record) => hydrateAllowanceDeductionRecord(record)),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getCompaniesForAllowanceDeductions(): Promise<
  { value: string; label: string }[]
> {
  await dbConnect();

  const companies = await Company.find({ status: "active", deletedAt: null })
    .select("_id name")
    .sort({ name: 1 })
    .lean();

  return (companies as any[]).map((company) => ({
    value: company._id.toString(),
    label: company.name,
  }));
}
