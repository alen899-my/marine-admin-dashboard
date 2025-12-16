// src/app/api/noon-report/route.ts
import { dbConnect } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// MODEL
import { noonReportSchema } from "@/lib/validations/noonReportSchema";
import ReportDaily from "@/models/ReportDaily";

//  GET ALL NOON REPORTS
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";

    // 1. Extract Date Params
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    // -----------------------------
    // BUILD QUERY OBJECT
    // -----------------------------
    // Fixed: Use Record<string, unknown> to satisfy no-explicit-any
    const query: Record<string, unknown> = {};

    // STATUS FILTER
    if (status !== "all") {
      query.status = status;
    }

    // SEARCH FILTER
    if (search) {
      query.$or = [
        { vesselName: { $regex: search, $options: "i" } },
        { voyageId: { $regex: search, $options: "i" } },
        { "navigation.nextPort": { $regex: search, $options: "i" } },
      ];
    }

    // 2. Apply Date Filter (Exact match to NOR logic)
    if (startDate || endDate) {
      // Define a typed object for the date query to avoid implicitly creating properties on 'unknown'
      const dateQuery: { $gte?: Date; $lte?: Date } = {};

      if (startDate) {
        // Start of the selected day
        dateQuery.$gte = new Date(startDate);
      }

      if (endDate) {
        // End of the selected day (23:59:59.999)
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.$lte = end;
      }

      // Assign the typed object to the query
      query.reportDate = dateQuery;
    }

    // COUNT
    const total = await ReportDaily.countDocuments(query);

    // FETCH REPORTS
    const reports = await ReportDaily.find(query)
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
  } catch (error: unknown) {
    // Fixed: Use 'unknown' type and narrow safely
    console.error("GET NOON REPORT ERROR →", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

// CREATE NOON REPORT
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    // JOI VALIDATION
    const { error, value } = noonReportSchema.validate(body, {
      abortEarly: false,
    });

    if (error) {
      return NextResponse.json(
        {
          error: "Validation Failed",
          details: error.details.map((d) => ({
            field: d.path[0],
            message: d.message,
          })),
        },
        { status: 400 }
      );
    }

    // CLEAN DATA
    const {
      vesselName,
      voyageNo,
      reportDate,
      nextPort,
      latitude,
      longitude,
      distanceTravelled,
      distanceToGo,
      vlsfoConsumed,
      lsmgoConsumed,
      windForce,
      seaState,
      weatherRemarks,
      generalRemarks,
    } = value;

    // SAVE REPORT
    const report = await ReportDaily.create({
      vesselName: vesselName,
      voyageId: voyageNo,

      type: "noon",
      status: "active",
      // ***** CHANGE: Ensure Date is created from valid string *****
      reportDate: new Date(reportDate),

      position: {
        lat: latitude,
        long: longitude,
      },

      navigation: {
        distLast24h: Number(distanceTravelled ?? 0),
        distToGo: Number(distanceToGo ?? 0),
        nextPort: nextPort,
      },

      consumption: {
        vlsfo: Number(vlsfoConsumed ?? 0),
        lsmgo: Number(lsmgoConsumed ?? 0),
      },

      weather: {
        wind: windForce,
        seaState: seaState,
        remarks: weatherRemarks,
      },

      remarks: `${generalRemarks || ""}`,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Daily noon report submitted.",
        report,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Fixed: Use 'unknown' type and narrow safely
    console.error("NOON REPORT ERROR →", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}