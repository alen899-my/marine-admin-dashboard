import { dbConnect } from "@/lib/db";
import ReportOperational from "@/models/ReportOperational";
import ReportDaily from "@/models/ReportDaily";
import Company from "@/models/Company";
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage";
import User from "@/models/User";

// Helper: Parse Date
function parseDateString(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return date;
    }
  }
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? undefined : date;
}

interface GetArrivalReportsParams {
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

export async function getArrivalReports({
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
}: GetArrivalReportsParams) {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = user.company?.id || user.company;
  const isAdmin = user.role?.toLowerCase() === "admin";
  const canSeeHistory = user.permissions?.includes("reports.history.views") || isSuperAdmin;

  const skip = (page - 1) * limit;
  const query: any = { eventType: "arrival", deletedAt: null };

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
        if (!companyVesselIds.some(id => id.toString() === selectedVessel)) return emptyResult;
        query.vesselId = selectedVessel;
    } else {
        query.vesselId = { $in: companyVesselIds };
    }

    if (!isAdmin) query.createdBy = user.id;
  } else {
    // Super Admin
    if (selectedCompany && selectedCompany !== "all") {
       const companyVessels = await Vessel.find({ company: selectedCompany, deletedAt: null }).select("_id");
       const companyVesselIds = companyVessels.map((v) => v._id);
       
       if (selectedVessel) {
          if (!companyVesselIds.some(id => id.toString() === selectedVessel)) return emptyResult;
          query.vesselId = selectedVessel;
       } else {
          query.vesselId = { $in: companyVesselIds };
       }
    } else if (selectedVessel) {
       query.vesselId = selectedVessel;
    }
  }

  // --- 2. Filters ---
  if (status && status !== "all") query.status = status;
  if (voyageId) query.voyageId = voyageId;

  if (startDate || endDate) {
    const dateQuery: any = {};
    const startD = parseDateString(startDate);
    const endD = parseDateString(endDate);
    if (startD) dateQuery.$gte = startD;
    if (endD) {
      endD.setHours(23, 59, 59, 999);
      dateQuery.$lte = endD;
    }
    if (Object.keys(dateQuery).length > 0) query.reportDate = dateQuery;
  } else if (!canSeeHistory) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    query.reportDate = { $gte: startOfDay, $lte: new Date() };
  }

  if (search) {
    query.$and = [
      { deletedAt: null },
      {
        $or: [
          { vesselName: { $regex: search, $options: "i" } },
          { voyageNo: { $regex: search, $options: "i" } },
          { portName: { $regex: search, $options: "i" } },
        ],
      },
    ];
  }

  // --- 3. Execute Query ---
  const [total, reports] = await Promise.all([
    ReportOperational.countDocuments(query),
    ReportOperational.find(query)
      .populate("voyageId", "voyageNo")
      .populate({
        path: "vesselId",
        select: "name company",
        populate: { path: "company", select: "name" },
      })
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  // --- 4. Bulk Metrics Calculation ---
  let reportsWithMetrics: any[] = [];
  
  if (reports.length > 0) {
     const voyageIds = reports.map((r: any) => r.voyageId?._id).filter(Boolean);
     
     const [departures, noonReports] = await Promise.all([
        ReportOperational.find({
            voyageId: { $in: voyageIds },
            eventType: "departure",
            status: "active",
            deletedAt: null
        }).lean(),
        ReportDaily.find({
            voyageId: { $in: voyageIds },
            status: "active",
            deletedAt: null
        }).lean()
     ]);

     const departureMap = new Map(departures.map((d:any) => [d.voyageId.toString(), d]));
     const noonMap = new Map<string, any[]>();
     noonReports.forEach((n:any) => {
        const id = n.voyageId.toString();
        if(!noonMap.has(id)) noonMap.set(id, []);
        noonMap.get(id)!.push(n);
     });

     reportsWithMetrics = reports.map((report: any) => {
        const vId = report.voyageId?._id?.toString();
        if(!vId) return { ...report, metrics: null };

        const departure = departureMap.get(vId);
        if(!departure) return { ...report, metrics: null };

        const arrTime = new Date(report.eventTime || report.reportDate).getTime();
        const depTime = new Date(departure.eventTime || departure.reportDate).getTime();
        
        const noonList = (noonMap.get(vId) || []).filter((n:any) => {
             const t = new Date(n.reportDate).getTime();
             return t >= depTime - 3600000 && t <= arrTime + 3600000;
        });

        const totalTimeHours = Math.max(0, (arrTime - depTime) / 36e5);
        const totalDistance = noonList.reduce((sum: number, n: any) => sum + (Number(n.navigation?.distLast24h) || 0), 0);

        const fuel = (t: string) => {
             const dep = Number(departure.departureStats?.[`rob${t}`]) || 0;
             const bunk = Number(departure.departureStats?.[`bunkersReceived${t}`]) || 0;
             const arr = Number(report.arrivalStats?.[`rob${t}`]) || 0;
             return dep + bunk - arr;
        };

        return {
             ...report,
             metrics: {
                 totalTimeHours: +totalTimeHours.toFixed(2),
                 totalDistance: +totalDistance.toFixed(2),
                 avgSpeed: totalTimeHours > 0 ? +(totalDistance / totalTimeHours).toFixed(2) : 0,
                 consumedVlsfo: +fuel("Vlsfo").toFixed(2),
                 consumedLsmgo: +fuel("Lsmgo").toFixed(2)
             }
        };
     });
  }

  const serializedReports = JSON.parse(JSON.stringify(reportsWithMetrics.length > 0 ? reportsWithMetrics : reports));

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