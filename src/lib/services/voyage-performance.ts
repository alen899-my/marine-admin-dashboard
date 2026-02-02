import { dbConnect } from "@/lib/db";
import ReportOperational from "@/models/ReportOperational";
import ReportDaily from "@/models/ReportDaily";
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage";
import { authorizeRequest } from "@/lib/authorizeRequest";

export async function getVoyagePerformanceData(voyageId: string) {
  if (!voyageId) return null;
  await dbConnect();

  // 1. Permission Check
  const authz = await authorizeRequest("voyageanalysis.view");
  if (!authz.ok) throw new Error("Unauthorized: Insufficient permissions");

  // 2. Fetch Operational Reports
  const [departureReport, arrivalReport] = await Promise.all([
    ReportOperational.findOne({
      voyageId,
      eventType: "departure",
      deletedAt: null,
    }).lean(),
    ReportOperational.findOne({
      voyageId,
      eventType: "arrival",
      deletedAt: null,
    }).lean(),
  ]);

  // 3. Fetch Daily Noon Reports
  const dailyReports = await ReportDaily.find({
    voyageId,
    type: "noon",
    deletedAt: null,
  })
    .sort({ reportDate: 1 })
    .lean();

  const safeISO = (date: any) => (date ? new Date(date).toISOString() : "");

  return {
    operational: {
      departure: {
        eventTime: safeISO(departureReport?.eventTime),
        plannedNm: departureReport?.navigation?.distanceToNextPortNm || "",
        rfaDt: safeISO(departureReport?.eventTime), 
        stats: {
          robVlsfo: departureReport?.departureStats?.robVlsfo || 0,
          robLsmgo: departureReport?.departureStats?.robLsmgo || 0,
        },
      },
      arrival: {
        eventTime: safeISO(arrivalReport?.eventTime) || safeISO(arrivalReport?.arrivalStats?.arrivalTime),
        stats: {
          robVlsfo: arrivalReport?.arrivalStats?.robVlsfo || 0,
          robLsmgo: arrivalReport?.arrivalStats?.robLsmgo || 0,
        },
      },
    },
    dailyReports: dailyReports.map((report: any) => ({
      reportDate: safeISO(report.reportDate),
      navigation: {
        distLast24h: report.navigation?.distLast24h || 0,
      },
      weather: {
        remarks: report.weather?.remarks || report.remarks || "",
      },
    })),
  };
}

// ✅ FIX: Strict Multi-Tenancy Logic
export async function getAnalysisOptions(vesselId?: string, user?: any) {
  await dbConnect();

  const isSuperAdmin = user?.role?.toLowerCase() === "super-admin";
  
  // Robustly extract company ID (handles your specific user object structure)
  const userCompanyId = user?.company?.id || user?.company?._id || user?.company;

  const vesselQuery: any = { status: "active", deletedAt: null };
  
  if (!isSuperAdmin) {
    // 🛑 SECURITY CHECK: If we can't identify the company, return NOTHING.
    // This prevents the "All vessels" leak if the user object is missing or malformed.
    if (!userCompanyId) {
      return { vessels: [], voyages: [] };
    }
    vesselQuery.company = userCompanyId;
  }

  // Fetch Vessels
  const vessels = await Vessel.find(vesselQuery)
    .select("_id name")
    .sort({ name: 1 })
    .lean();

  let voyages: any[] = [];
  
  if (vesselId) {
    voyages = await Voyage.find({ 
        vesselId, 
        status: "active", 
        deletedAt: null 
    })
      .select("_id voyageNo")
      .sort({ createdAt: -1 })
      .lean();
  }

  return {
    vessels: JSON.parse(JSON.stringify(vessels)),
    voyages: JSON.parse(JSON.stringify(voyages)),
  };
}