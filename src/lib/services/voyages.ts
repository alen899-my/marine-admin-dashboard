import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";
import User from "@/models/User";
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage";

// Ensure models are registered
const _ensureModels = [User, Company, Vessel, Voyage];

interface GetVoyagesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  companyId?: string;
  user: any;
}

export async function getVoyages({
  page = 1,
  limit = 20,
  search,
  status,
  startDate,
  endDate,
  companyId,
  user,
}: GetVoyagesParams) {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = user.company?.id || user.company;
  const skip = (page - 1) * limit;

  // Initial Query: Exclude soft-deleted records
  const query: any = { deletedAt: null };

  // --- 1. Multi-Tenancy Logic ---
  if (!isSuperAdmin) {
    if (!userCompanyId) throw new Error("No company assigned");

    // Find vessels for this company
    const companyVessels = await Vessel.find({ company: userCompanyId }).select(
      "_id",
    );
    const companyVesselIds = companyVessels.map((v) => v._id);

    query.vesselId = { $in: companyVesselIds };
  } else {
    // Super Admin filtering by company
    if (companyId && companyId !== "all") {
      const targetVessels = await Vessel.find({ company: companyId }).select(
        "_id",
      );
      const targetVesselIds = targetVessels.map((v) => v._id);
      query.vesselId = { $in: targetVesselIds };
    }
  }

  // --- 2. Filters ---
  if (status && status !== "all") query.status = status;

  if (startDate && endDate) {
    query["schedule.eta"] = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  if (search) {
    const vesselSearchQuery: any = { name: { $regex: search, $options: "i" } };
    if (!isSuperAdmin) vesselSearchQuery.company = userCompanyId;

    const matchingVessels = await Vessel.find(vesselSearchQuery).select("_id");
    const vesselIds = matchingVessels.map((v) => v._id);

    query.$or = [
      { voyageNo: { $regex: search, $options: "i" } },
      { "route.loadPort": { $regex: search, $options: "i" } },
      { vesselId: { $in: vesselIds } },
    ];
  }

  // --- 3. Execute Query ---
  const [total, voyages] = await Promise.all([
    Voyage.countDocuments(query),
    Voyage.find(query)
      .populate({
        path: "vesselId",
        select: "name imo company",
        populate: { path: "company", select: "name" },
      })
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const serializedVoyages = JSON.parse(JSON.stringify(voyages));

  return {
    data: serializedVoyages,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Fetch Dropdown Options
export async function getVoyageOptions(user: any) {
  await dbConnect();
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = user.company?.id || user.company;

  const companyFilter: any = isSuperAdmin
    ? { deletedAt: null }
    : { _id: userCompanyId, deletedAt: null };
  const vesselFilter: any = { status: "active", deletedAt: null };

  if (!isSuperAdmin) vesselFilter.company = userCompanyId;

  const [companies, vessels] = await Promise.all([
    Company.find(companyFilter).select("_id name").sort({ name: 1 }).lean(),
    Vessel.find(vesselFilter).select("_id name").sort({ name: 1 }).lean(),
  ]);

  return {
    companies: JSON.parse(JSON.stringify(companies)),
    vessels: JSON.parse(JSON.stringify(vessels)),
  };
}
