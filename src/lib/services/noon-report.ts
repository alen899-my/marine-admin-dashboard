import { dbConnect } from "@/lib/db";
import ReportDaily from "@/models/ReportDaily";
import Company from "@/models/Company";
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage";
import User from "@/models/User";
import { cache } from "react";
import { unstable_cache } from "next/cache";
// Ensure models are registered
const _ensureModels = [Vessel, Voyage, User, Company, ReportDaily];

function parseDateString(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;

  // Handle DD/MM/YYYY format explicitly
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);

      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return date;
    }
  }

  // Fallback to standard parsing (ISO strings, YYYY-MM-DD)
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? undefined : date;
}

interface GetNoonReportsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  vesselId?: string;
  voyageId?: string;
  companyId?: string;
  user: any;
}

async function fetchNoonReportsRaw(params: GetNoonReportsParams) {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    startDate,
    endDate,
    vesselId,
    voyageId,
    companyId,
    user,
  } = params;
  console.log("🚀 Database Query Executed: Fetching Noon Reports");
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = user.company?.id || user.company;
  const isAdmin = user.role?.toLowerCase() === "admin";
  const canSeeHistory = user.permissions?.includes("reports.history.views") || isSuperAdmin;

  const skip = (page - 1) * limit;
  const query: any = { deletedAt: null };

  const emptyResult = {
    data: [],
    pagination: { total: 0, page, limit, totalPages: 0 }
  };

  // --- 1. Multi-Tenancy Logic ---
  const selectedVessel = vesselId;
  const selectedCompany = companyId;

  if (!isSuperAdmin) {
    if (!userCompanyId) throw new Error("No company assigned");

    const companyVessels = await Vessel.find({ company: userCompanyId, deletedAt: null }).select("_id");
    const companyVesselIds = companyVessels.map((v) => v._id);

    if (selectedVessel) {
      if (!companyVesselIds.some(id => id.toString() === selectedVessel)) {
        return emptyResult;
      }
      query.vesselId = selectedVessel;
    } else {
      query.vesselId = { $in: companyVesselIds };
    }

    if (!isAdmin) {
      query.createdBy = user.id;
    }
  } else {
    // Super Admin Logic
    if (selectedCompany && selectedCompany !== "all") {
      const companyVessels = await Vessel.find({ company: selectedCompany, deletedAt: null }).select("_id");
      const companyVesselIds = companyVessels.map((v) => v._id);

      if (selectedVessel) {
        if (!companyVesselIds.some(id => id.toString() === selectedVessel)) {
          return emptyResult;
        }
        query.vesselId = selectedVessel;
      } else {
        query.vesselId = { $in: companyVesselIds };
      }
    } else if (selectedVessel) {
      query.vesselId = selectedVessel;
    }
  }

  // --- 2. Report Filters ---
  if (status && status !== "all") query.status = status;
  if (voyageId) query.voyageId = voyageId;

  // Logic: Check if Date Filters exist OR if user is restricted from seeing history
  if (startDate || endDate) {
    const dateQuery: any = {};

    // Parse using the robust helper
    const startD = parseDateString(startDate);
    const endD = parseDateString(endDate);

    if (startD) {
      dateQuery.$gte = startD;
    }

    if (endD) {
      // Set end date to end of that day
      endD.setHours(23, 59, 59, 999);
      dateQuery.$lte = endD;
    }

    // Only apply if we successfully parsed at least one date
    if (Object.keys(dateQuery).length > 0) {
      query.reportDate = dateQuery;
    }
  } else if (!canSeeHistory) {
    // Default view for users without history permission
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    query.reportDate = { $gte: startOfDay, $lte: new Date() };
  }

  // Search
  if (search) {
    query.$and = [
      { deletedAt: null },
      {
        $or: [
          { vesselName: { $regex: search, $options: "i" } },
          { voyageNo: { $regex: search, $options: "i" } },
          { "navigation.nextPort": { $regex: search, $options: "i" } },
        ],
      },
    ];
  }

  // --- 4. Execute Query ---
  const [total, reports] = await Promise.all([
    ReportDaily.countDocuments(query),
    ReportDaily.find(query)
      .populate({
        path: "vesselId",
        select: "name company",
        populate: { path: "company", select: "name" },
      })
      .populate("voyageId", "voyageNo")
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName")
      .sort({ reportDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const serializedReports = JSON.parse(JSON.stringify(reports));

  return {
    data: serializedReports,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };

}
export const getNoonReports = (params: GetNoonReportsParams) => {
  // Use user ID and filter params to create a unique cache key
  const cacheKey = [
    "noon-reports",
    params.user?.id,
    params.page,
    params.search,
    params.status,
    params.vesselId,
    params.companyId
  ].join("-");

  return unstable_cache(
    async () => fetchNoonReportsRaw(params),
    [cacheKey],
    {
      tags: ["noon-reports-tag"],
      revalidate: 3600, // Revalidate every hour fallback
    }
  )();
};

export async function getFilterOptions(user: any) {
  await dbConnect();
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = user.company?.id || user.company;

  const companyFilter: any = isSuperAdmin ? { deletedAt: null } : { _id: userCompanyId, deletedAt: null };
  const vesselFilter: any = { status: "active", deletedAt: null };

  if (!isSuperAdmin) vesselFilter.company = userCompanyId;

  const [companies, vessels] = await Promise.all([
    Company.find(companyFilter).select("_id name").sort({ name: 1 }).lean(),
    Vessel.find(vesselFilter).select("_id name company").sort({ name: 1 }).lean()
  ]);

  const allowedVesselIds = vessels.map((v: any) => v._id.toString());

  // 3. Fetch Active Voyages for these vessels
  const voyages = await Voyage.find({
    vesselId: { $in: allowedVesselIds },
    status: "active",
    deletedAt: null
  })
    .select("_id vesselId voyageNo")
    .lean();

  return {
    companies: JSON.parse(JSON.stringify(companies)),
    vessels: JSON.parse(JSON.stringify(vessels)),
    voyages: JSON.parse(JSON.stringify(voyages))
  };
}