import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";

// MODEL
import ReportOperational from "@/models/ReportOperational";

// VALIDATION
import { arrivalReportSchema } from "@/lib/validations/arrivalReportSchema";

/* ======================================
   GET ALL ARRIVAL REPORTS
====================================== */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    // 1. Get Search & Status
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 2. Initialize Query (Base Rule)
    // Fixed: Replaced 'any' with 'Record<string, unknown>'
    const query: Record<string, unknown> = { eventType: "arrival" };

    // 3. Apply Status Filter
    if (status !== "all") {
      query.status = status;
    }

    // 4. Apply Search Filter
    if (search) {
      query.$or = [
        { vesselName: { $regex: search, $options: "i" } },
        { voyageId: { $regex: search, $options: "i" } },
        { portName: { $regex: search, $options: "i" } },
      ];
    }

    // ✅ Date Filter Addition: Apply Date Range Query
    if (startDate || endDate) {
      // Create a typed object for the date query
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
      
      // Assign the typed object to the query
      query.reportDate = dateQuery;
    }

    // 5. Fetch Data
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
    console.error("GET ARRIVAL REPORT ERROR →", error);
    return NextResponse.json(
      { error: "Failed to fetch arrival reports" },
      { status: 500 }
    );
  }
}

/* ======================================
   CREATE ARRIVAL REPORT
====================================== */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const { error, value } = arrivalReportSchema.validate(body, {
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
      eventType: "arrival",
      status: "active",

      vesselName: value.vesselName,
      voyageId: value.voyageId,
      portName: value.portName,

      // ✅ ADDED: Reporting Date
      reportDate: new Date(value.reportDate),

      // ✅ shared field
      eventTime: new Date(value.arrivalTime),

      arrivalStats: {
        robVlsfo: value.robVlsfo,
        robLsmgo: value.robLsmgo,
      },

      remarks: value.remarks,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Arrival report created successfully",
        report,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE ARRIVAL REPORT ERROR →", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}