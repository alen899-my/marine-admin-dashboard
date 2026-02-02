import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";

interface GetCompaniesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  user: any; // Session user
}

export async function getCompanies({
  page = 1,
  limit = 20,
  search = "",
  status = "all",
  startDate,
  endDate,
  user,
}: GetCompaniesParams) {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = user.company?.id;
  const skip = (page - 1) * limit;

  // 1. Authorization & Scoping Logic
  const query: any = { deletedAt: null };

  if (!isSuperAdmin) {
    if (!userCompanyId) {
      return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    }
    // Restrict to their own company
    query._id = userCompanyId;
  }

  // 2. Status Filter
  if (status && status !== "all") {
    query.status = status;
  }

  // 3. Search Filter
  if (search.trim()) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { address: { $regex: search, $options: "i" } },
      { contactName: { $regex: search, $options: "i" } },
      { contactEmail: { $regex: search, $options: "i" } },
    ];
  }

  // 4. Date Filter
  if (startDate || endDate) {
    const dateQuery: any = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateQuery.$lte = end;
    }
    query.createdAt = dateQuery;
  }

  // 5. Execute Query
  const [data, total] = await Promise.all([
    Company.find(query)
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Company.countDocuments(query),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // 6. Serialize & Return
  return {
    data: JSON.parse(JSON.stringify(data)),
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}