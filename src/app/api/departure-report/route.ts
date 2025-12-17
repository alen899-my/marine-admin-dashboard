import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";

// MODEL
import ReportOperational from "@/models/ReportOperational";

// VALIDATION
import { departureReportSchema } from "@/lib/validations/departureReportSchema";

// ✅ HELPER: Parse "dd/mm/yyyy" string to Date object
function parseDateString(dateStr: string | null | undefined): Date | undefined {
  if (!dateStr) return undefined;

  // Check if string matches dd/mm/yyyy format (simple check)
  if (typeof dateStr === "string" && dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed in JS
      const year = parseInt(parts[2], 10);
      
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // Fallback: Try standard parsing (for ISO strings or if Joi already converted it)
  const fallbackDate = new Date(dateStr);
  return isNaN(fallbackDate.getTime()) ? undefined : fallbackDate;
}

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
        // ✅ Parse dd/mm/yyyy
        const parsedStart = parseDateString(startDate);
        if (parsedStart) {
          dateQuery.$gte = parsedStart;
        }
      }

      if (endDate) {
        // ✅ Parse dd/mm/yyyy
        const parsedEnd = parseDateString(endDate);
        if (parsedEnd) {
          // End of the selected day (23:59:59.999)
          parsedEnd.setHours(23, 59, 59, 999);
          dateQuery.$lte = parsedEnd;
        }
      }
      
      // Only attach if we successfully parsed at least one date
      if (dateQuery.$gte || dateQuery.$lte) {
        query.reportDate = dateQuery;
      }
    }

    // 3. Fetch Data using the 'query' object
    const total = await ReportOperational.countDocuments(query); 

    const reports = await ReportOperational.find(query) 
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

    // ✅ PARSE DATE safely here
    const parsedReportDate = parseDateString(value.reportDate);

    if (!parsedReportDate) {
        return NextResponse.json(
            { error: "Invalid Date Format. Please use dd/mm/yyyy" }, 
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
      
      // ✅ Use the parsed date object
      reportDate: parsedReportDate,

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
    console.error("CREATE DEPARTURE REPORT ERROR →", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}