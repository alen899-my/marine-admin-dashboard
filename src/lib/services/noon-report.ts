import { dbConnect } from "@/lib/db";
import ReportDaily from "@/models/ReportDaily";
import Company from "@/models/Company";
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage";
import User from "@/models/User";
import { localStartOfDay, parseDateInTz, parseEndDateInTz } from "@/lib/timezone";

// Ensure models are registered
const _ensureModels = [Vessel, Voyage, User, Company, ReportDaily];


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
   tz?: string; // IANA timezone name, e.g. "Asia/Kolkata"
  user: any; 
}

export async function getNoonReports({
  page = 1,
  limit = 20,
  search,
  status,
  startDate,
  endDate,
  vesselId,
  voyageId,
  companyId,
  tz = "UTC",
  user,
}: GetNoonReportsParams) {
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
    if (startDate) dateQuery.$gte = parseDateInTz(startDate, tz);
    if (endDate) dateQuery.$lte = parseEndDateInTz(endDate, tz);
     // If the user cannot see history, clamp the lower bound to today
    if (!canSeeHistory) {
      const todayStart = localStartOfDay(tz);
      if (!dateQuery.$gte || dateQuery.$gte < todayStart) dateQuery.$gte = todayStart;
      if (!dateQuery.$lte || dateQuery.$lte > new Date()) dateQuery.$lte = new Date();
    }
    if (Object.keys(dateQuery).length > 0) query.reportDate = dateQuery;
  } else if (!canSeeHistory) {
    // Show only today's reports, computed in the user's local timezone
    query.reportDate = { $gte: localStartOfDay(tz), $lte: new Date() };
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