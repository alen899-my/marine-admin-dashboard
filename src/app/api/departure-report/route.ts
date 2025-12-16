import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";

// MODEL
import ReportOperational from "@/models/ReportOperational";

// VALIDATION
import { departureReportSchema } from "@/lib/validations/departureReportSchema";

/* ======================================
   GET ALL DEPARTURE REPORTS
====================================== */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    // ✅ Date Filter Addition: Extract Dates
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 1. Initialize the query object
    // Fixed: Use Record<string, unknown> instead of 'any' or 'Record<string, any>'
    const query: Record<string, unknown> = { eventType: "departure" };

    // 2. Apply Filters (BEFORE fetching data)
    if (status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { vesselName: { $regex: search, $options: "i" } },
        { voyageId: { $regex: search, $options: "i" } },
        { portName: { $regex: search, $options: "i" } },
      ];
    }
    
    // ✅ Date Filter Addition: Apply Date Range Query
    if (startDate || endDate) {
      // Create typed date query object
      const dateQuery: { $gte?: Date; $lte?: Date } = {};

      if (startDate) {
        dateQuery.$gte = new Date(startDate);
      }

      if (endDate) {
        // End of the selected day (23:59:59)
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.$lte = end;
      }
      
      // Assign to query
      query.reportDate = dateQuery;
    }

    // 3. Fetch Data using the 'query' object (NOT 'filter')
    const total = await ReportOperational.countDocuments(query); // Use query here

    const reports = await ReportOperational.find(query) // Use query here
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET DEPARTURE REPORT ERROR →", error);
    return NextResponse.json(
      { error: "Failed to fetch departure reports" },
      { status: 500 }
    );
  }
}

/* ======================================
   CREATE DEPARTURE REPORT
====================================== */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const { error, value } = departureReportSchema.validate(body, {
      abortEarly: false,
    });

    if (error) {
      return NextResponse.json(
        {
          error: "Validation Failed",
          details: error.details.map((d) => ({
            field: d.path.join("."),
            message: d.message,
          })),
        },
        { status: 400 }
      );
    }

    const report = await ReportOperational.create({
      eventType: "departure",
      status: "active",

      vesselName: value.vesselName,
      voyageId: value.voyageId,
      portName: value.portName,
      eventTime: new Date(value.eventTime),
      reportDate: new Date(value.reportDate),

      navigation: {
        distanceToGo: value.distanceToGo,
        etaNextPort: value.etaNextPort ? new Date(value.etaNextPort) : null,
      },

      departureStats: {
        robVlsfo: value.robVlsfo,
        robLsmgo: value.robLsmgo,
        cargoSummary: value.cargoSummary,
      },

      remarks: value.remarks,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Departure report created successfully",
        report,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Fixed: Use 'unknown' type and log error safely
    console.error("CREATE DEPARTURE REPORT ERROR →", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}