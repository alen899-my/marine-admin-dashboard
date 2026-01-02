// src/app/api/arrival-report/route.ts
import { dbConnect } from "@/lib/db";
import Voyage from "@/models/Voyage"; 
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { authorizeRequest } from "@/lib/authorizeRequest";
import ReportOperational from "@/models/ReportOperational";
import ReportDaily from "@/models/ReportDaily";
import Vessel from "@/models/Vessel";
import { arrivalReportSchema } from "@/lib/validations/arrivalReportSchema";

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
   GET ALL ARRIVAL REPORTS
====================================== */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // 1. Force Register Models for population
    const _v = Voyage;
    const _vsl = Vessel;

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const selectedVessel = searchParams.get("vesselId");
    const selectedVoyage = searchParams.get("voyageId");

    const query: Record<string, unknown> = { eventType: "arrival" };

    if (status !== "all") query.status = status;
    if (selectedVessel) query.vesselId = selectedVessel;
    if (selectedVoyage) query.voyageId = selectedVoyage;

    if (search) {
      query.$or = [
        { vesselName: { $regex: search, $options: "i" } },
        { voyageNo: { $regex: search, $options: "i" } },
        { portName: { $regex: search, $options: "i" } },
      ];
    }

    // Date Filtering Logic
    if (startDate || endDate) {
      const dateQuery: any = {};
      const parsedStart = parseDateString(startDate);
      if (parsedStart) dateQuery.$gte = parsedStart;
      const parsedEnd = parseDateString(endDate);
      if (parsedEnd) {
        parsedEnd.setHours(23, 59, 59, 999);
        dateQuery.$lte = parsedEnd;
      }
      if (Object.keys(dateQuery).length > 0) query.reportDate = dateQuery;
    }

    const total = await ReportOperational.countDocuments(query);
    const rawReports = await ReportOperational.find(query)
      .populate("voyageId", "voyageNo _id")
      .populate("vesselId", "name")
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // 2. ENHANCED LOGIC: Calculate Metrics on Server for all records in this page
    const reportsWithMetrics = await Promise.all(
  rawReports.map(async (report: any) => {
    if (!report.voyageId) return { ...report, metrics: null };

    const vId = report.voyageId._id || report.voyageId;

    const [departure, noonReports] = await Promise.all([
      ReportOperational.findOne({ voyageId: vId, eventType: "departure", status: "active" }).lean(),
      ReportDaily.find({ voyageId: vId, status: "active" }).lean(),
    ]);

    if (!departure) return { ...report, metrics: null };

    // --- Calculations ---
    
    // 1. Total Time (Arrival EventTime - Departure EventTime)
    const arrTime = new Date(report.eventTime || report.reportDate).getTime();
    const depTime = new Date(departure.eventTime || departure.reportDate).getTime();
    const totalTimeHours = Math.max(0, (arrTime - depTime) / (1000 * 60 * 60));

    // 2. Total Distance (Sum of Noon Report observed distances)
    const totalDistance = noonReports.reduce((sum, doc) => 
      sum + (Number(doc.navigation?.distLast24h) || 0), 0
    );

    // 3. Fuel Consumed (The "Captain's Formula")
    const getFuel = (fuelType: "Vlsfo" | "Lsmgo") => {
      const depROB = Number(departure.departureStats?.[`rob${fuelType}`]) || 0;
      const bunk = Number(departure.departureStats?.[`bunkersReceived${fuelType}`]) || 0;
      const arrROB = Number(report.arrivalStats?.[`rob${fuelType}`]) || 0;
      return (depROB + bunk) - arrROB;
    };

    return {
      ...report,
      metrics: {
        totalTimeHours: Number(totalTimeHours.toFixed(2)),
        totalDistance: Number(totalDistance.toFixed(2)),
        avgSpeed: totalTimeHours > 0 ? Number((totalDistance / totalTimeHours).toFixed(2)) : 0,
        consumedVlsfo: Number(getFuel("Vlsfo").toFixed(2)),
        consumedLsmgo: Number(getFuel("Lsmgo").toFixed(2)),
      }
    };
  })
);

    return NextResponse.json({
      data: reportsWithMetrics,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET ARRIVAL REPORT ERROR →", error);
    return NextResponse.json({ error: "Failed to fetch arrival reports" }, { status: 500 });
  }
}

/* ======================================
   CREATE ARRIVAL REPORT
====================================== */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const authz = await authorizeRequest("arrival.create");
    if (!authz.ok) return authz.response;
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

    // ✅ PARSE DATE safely here
    const parsedReportDate = parseDateString(value.reportDate);

    if (!parsedReportDate) {
      return NextResponse.json(
        { error: "Invalid Date Format. Please use dd/mm/yyyy" },
        { status: 400 }
      );
    }

    // ==========================================
    // ✅ 1. ADDED VOYAGE ID LOOKUP LOGIC
    // ==========================================
    const voyageNoString = value.voyageId; // Frontend sends string "OP-1225"
    const vesselIdString = value.vesselId;
    let voyageObjectId = null;

    if (vesselIdString && voyageNoString) {
      const vId = new mongoose.Types.ObjectId(vesselIdString);

      // Find the Voyage Document to get its _id
      const foundVoyage = await Voyage.findOne({
        vesselId: vId,
        // Case-insensitive match for the voyage number
        voyageNo: { $regex: new RegExp(`^${voyageNoString}$`, "i") },
      }).select("_id");

      if (foundVoyage) {
        voyageObjectId = foundVoyage._id;
      } else {
        return NextResponse.json(
          { error: `Voyage ${voyageNoString} not found for this vessel.` },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Missing Vessel ID or Voyage Number" },
        { status: 400 }
      );
    }

    // ==========================================
    // ✅ 2. CREATE REPORT WITH MAPPED IDS
    // ==========================================
    const report = await ReportOperational.create({
      eventType: "arrival",
      status: "active",

      // IDs
      vesselId: vesselIdString,
      voyageId: voyageObjectId, // Saved as ObjectId (Link)

      // Snapshots
      vesselName: value.vesselName,
      voyageNo: voyageNoString, // Saved as String (Snapshot)
      createdBy: currentUserId,
      updatedBy: currentUserId,

      portName: value.portName,
      reportDate: parsedReportDate,
      eventTime: new Date(value.arrivalTime),

      arrivalStats: {
        robVlsfo: value.robVlsfo,
        robLsmgo: value.robLsmgo,
        arrivalCargoQtyMt: value.arrivalCargoQty,
      },

      norDetails: {
        norTime: value.norTime ? new Date(value.norTime) : undefined,
        tenderTime: value.norTime ? new Date(value.norTime) : undefined,
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
