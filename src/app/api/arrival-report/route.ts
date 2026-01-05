import { dbConnect } from "@/lib/db";

import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { authorizeRequest } from "@/lib/authorizeRequest";


import { arrivalReportSchema } from "@/lib/validations/arrivalReportSchema";
import User from "@/models/User"; 
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage";
import ReportOperational from "@/models/ReportOperational";
import ReportDaily from "@/models/ReportDaily";
/* ======================================================
   HELPER: Parse dd/mm/yyyy safely
====================================================== */
function parseDateString(dateStr?: string | null): Date | undefined {
  if (!dateStr) return;

  if (dateStr.includes("/")) {
    const [d, m, y] = dateStr.split("/").map(Number);
    const date = new Date(y, m - 1, d);
    if (!isNaN(date.getTime())) return date;
  }

  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? undefined : fallback;
}

/* ======================================================
   GET ALL ARRIVAL REPORTS (FAST, NO N+1)
====================================================== */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const _ensureModels = [Vessel, Voyage, User, ReportDaily];

    // Force model registration (Next.js dev safety)
    void Voyage;
    void Vessel;

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const vesselId = searchParams.get("vesselId");
    const voyageId = searchParams.get("voyageId");

    /* ------------------ BUILD QUERY ------------------ */
    const query: any = { eventType: "arrival" };

    if (status !== "all") query.status = status;
    if (vesselId) query.vesselId = vesselId;
    if (voyageId) query.voyageId = voyageId;

    if (search) {
      query.$or = [
        { vesselName: { $regex: search, $options: "i" } },
        { voyageNo: { $regex: search, $options: "i" } },
        { portName: { $regex: search, $options: "i" } },
      ];
    }

    if (startDate || endDate) {
      const dateQuery: any = {};
      const s = parseDateString(startDate);
      const e = parseDateString(endDate);
      if (s) dateQuery.$gte = s;
      if (e) {
        e.setHours(23, 59, 59, 999);
        dateQuery.$lte = e;
      }
      if (Object.keys(dateQuery).length) query.reportDate = dateQuery;
    }

    /* ------------------ MAIN ARRIVAL QUERY ------------------ */
    const total = await ReportOperational.countDocuments(query);

    const arrivals = await ReportOperational.find(query)
      .populate("voyageId", "voyageNo _id")
      .populate("vesselId", "name")
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    /* ------------------ NO DATA QUICK EXIT ------------------ */
    if (!arrivals.length) {
      return NextResponse.json({
        data: [],
        pagination: { page, limit, total, totalPages: 0 },
      });
    }

    /* ======================================================
       BULK METRICS CALCULATION (ONLY 2 EXTRA QUERIES)
    ====================================================== */

    const voyageIds = arrivals
      .map(r => r.voyageId?._id)
      .filter(Boolean)
      .map(id => id.toString());

    // 1️⃣ Fetch ALL departures at once
    const departures = await ReportOperational.find({
      voyageId: { $in: voyageIds },
      eventType: "departure",
      status: "active",
    }).lean();

    const departureMap = new Map(
      departures.map(d => [d.voyageId.toString(), d])
    );

    // 2️⃣ Fetch ALL noon reports at once
    const noonReports = await ReportDaily.find({
      voyageId: { $in: voyageIds },
      status: "active",
    }).lean();

    const noonMap = new Map<string, any[]>();
    for (const n of noonReports) {
      const id = n.voyageId.toString();
      if (!noonMap.has(id)) noonMap.set(id, []);
      noonMap.get(id)!.push(n);
    }

    /* ------------------ MERGE METRICS ------------------ */
    const reportsWithMetrics = arrivals.map(report => {
  const vId = report.voyageId?._id?.toString();
  if (!vId) return { ...report, metrics: null };

  const departure = departureMap.get(vId);
  if (!departure) return { ...report, metrics: null };

  // 1. Define times FIRST
  const arrTime = new Date(report.eventTime || report.reportDate).getTime();
  const depTime = new Date(departure.eventTime || departure.reportDate).getTime();

  // 2. Now you can use them in the filter
 const noonList = (noonMap.get(vId) || []).filter(n => {
  const noonTime = new Date(n.reportDate).getTime();
  // Buffer the start/end by 1 hour to catch reports exactly on the edge
  const buffer = 3600000; 
  return noonTime >= (depTime - buffer) && noonTime <= (arrTime + buffer);
});

  const totalTimeHours = Math.max(0, (arrTime - depTime) / 36e5);
const totalDistance = noonList.reduce(
  (sum, n) => sum + (Number(n.navigation?.distLast24h) || 0),
  0
);

      const fuel = (t: "Vlsfo" | "Lsmgo") => {
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
          avgSpeed:
            totalTimeHours > 0
              ? +(totalDistance / totalTimeHours).toFixed(2)
              : 0,
          consumedVlsfo: +fuel("Vlsfo").toFixed(2),
          consumedLsmgo: +fuel("Lsmgo").toFixed(2),
        },
      };
    });

    return NextResponse.json({
      data: reportsWithMetrics,
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
