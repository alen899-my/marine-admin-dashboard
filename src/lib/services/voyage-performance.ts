import { dbConnect } from "@/lib/db";
import ReportOperational from "@/models/ReportOperational";
import ReportDaily from "@/models/ReportDaily";
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage";

export async function getVoyagePerformanceData(voyageId: string) {
  if (!voyageId) return null;
  await dbConnect();

  // 1. Fetch Operational Reports (Departure and Arrival)
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

  // 2. Fetch Daily Noon Reports
  const dailyReports = await ReportDaily.find({
    voyageId,
    type: "noon",
    deletedAt: null,
  })
    .sort({ reportDate: 1 })
    .lean();

  // 3. Construct Response Object
  return {
    operational: {
      departure: {
        eventTime: departureReport?.eventTime ? departureReport.eventTime.toISOString() : "",
        plannedNm: departureReport?.navigation?.distanceToNextPortNm || "",
        rfaDt: departureReport?.eventTime ? departureReport.eventTime.toISOString() : "",
        stats: {
          robVlsfo: departureReport?.departureStats?.robVlsfo || 0,
          robLsmgo: departureReport?.departureStats?.robLsmgo || 0,
        },
      },
      arrival: {
        eventTime: arrivalReport?.eventTime ? arrivalReport.eventTime.toISOString() : "",
        stats: {
          robVlsfo: arrivalReport?.arrivalStats?.robVlsfo || 0,
          robLsmgo: arrivalReport?.arrivalStats?.robLsmgo || 0,
        },
      },
    },
    dailyReports: dailyReports.map((report: any) => ({
      reportDate: report.reportDate ? report.reportDate.toISOString() : "",
      navigation: {
        distLast24h: report.navigation?.distLast24h || 0,
      },
      weather: {
        remarks: report.weather?.remarks || report.remarks || "",
      },
    })),
  };
}

// Fetch Dropdown Options
export async function getAnalysisOptions(vesselId?: string) {
  await dbConnect();

  // Fetch Vessels
  const vessels = await Vessel.find({ status: "active", deletedAt: null })
    .select("_id name")
    .sort({ name: 1 })
    .lean();

  let voyages: any[] = [];
  
  // Fetch Voyages only if a vessel is selected
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