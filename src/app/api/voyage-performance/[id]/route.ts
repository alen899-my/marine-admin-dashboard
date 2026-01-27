import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import ReportDaily from "@/models/ReportDaily";
import ReportOperational from "@/models/ReportOperational";
import { auth } from "@/auth";
import { authorizeRequest } from "@/lib/authorizeRequest";

/**
 * GET: Fetch aggregated performance data for a specific Voyage (Leg)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // 1. Change type to Promise
) {
  try {
    await dbConnect();

    const authz = await authorizeRequest("voyageanalysis.view");
        if (!authz.ok) return authz.response;
    
    // 2. Await the params before accessing properties
    const { id: voyageId } = await params;



    // 1. Authorization Check
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch Operational Reports (Departure and Arrival)
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

    // 4. Construct Response (Matching your frontend logic)
    const performanceData = {
      operational: {
        departure: {
          eventTime: departureReport?.eventTime || "",
          plannedNm: departureReport?.navigation?.distanceToNextPortNm || "",
          rfaDt: departureReport?.eventTime || "",
          stats: {
            robVlsfo: departureReport?.departureStats?.robVlsfo || 0,
            robLsmgo: departureReport?.departureStats?.robLsmgo || 0,
          },
        },
        arrival: {
          eventTime: arrivalReport?.eventTime || arrivalReport?.arrivalStats?.arrivalTime || "",
          stats: {
            robVlsfo: arrivalReport?.arrivalStats?.robVlsfo || 0,
            robLsmgo: arrivalReport?.arrivalStats?.robLsmgo || 0,
          },
        },
      },
      dailyReports: dailyReports.map((report: any) => ({
        reportDate: report.reportDate,
        navigation: {
          distLast24h: report.navigation?.distLast24h || 0,
        },
        weather: {
          remarks: report.weather?.remarks || report.remarks || "",
        },
      })),
    };

    return NextResponse.json(performanceData);
  } catch (error: any) {
    console.error("Voyage Performance Aggregation Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}