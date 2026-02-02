import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";
import User from "@/models/User";
import Vessel from "@/models/Vessel";

const _ensureModels = [User, Company, Vessel];

interface GetVesselsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  companyId?: string;
  startDate?: string;
  endDate?: string;
  user: any;
}

export async function getVessels({
  page = 1,
  limit = 20,
  search,
  status,
  companyId,
  startDate,
  endDate,
  user,
}: GetVesselsParams) {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = user.company?.id || user.company;
  const skip = (page - 1) * limit;

  // Initial Query: Exclude soft-deleted records
  const query: any = { deletedAt: null };

  // --- 1. Multi-Tenancy Logic ---
  if (isSuperAdmin) {
    if (companyId && companyId !== "all") {
      query.company = companyId;
    }
  } else {
    // Restricted user: Force company ID
    if (!userCompanyId) throw new Error("No company assigned");
    query.company = userCompanyId;
  }

  // --- 2. Filters ---
  if (status && status !== "all") query.status = status;

  if (search) {
    query.$and = [
      { deletedAt: null },
      {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { imo: { $regex: search, $options: "i" } },
        ],
      },
    ];
  }

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  // --- 3. Execute Query ---
  const [total, vessels] = await Promise.all([
    Vessel.countDocuments(query),
    Vessel.find(query)
      .populate("company", "name")
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const serializedVessels = JSON.parse(JSON.stringify(vessels));

  return {
    data: serializedVessels,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Fetch Companies for Dropdown (Super Admin only)
export async function getCompanyOptions() {
  await dbConnect();
  const companies = await Company.find({ deletedAt: null })
    .select("_id name")
    .sort({ name: 1 })
    .lean();

  return JSON.parse(JSON.stringify(companies));
}
