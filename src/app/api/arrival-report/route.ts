// src/app/api/arrival-report/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Voyage from "@/models/Voyage"; // ✅ Import Voyage model
import mongoose from "mongoose";

import ReportOperational from "@/models/ReportOperational";
import { authorizeRequest } from "@/lib/authorizeRequest";

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
       
        { voyageNo: { $regex: search, $options: "i" } }, 
        { portName: { $regex: search, $options: "i" } },
      ];
    }

    // ✅ Date Filter Addition: Apply Date Range Query
    if (startDate || endDate) {
      // Create a typed object for the date query
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
      
      // Assign the typed object to the query only if valid
      if (dateQuery.$gte || dateQuery.$lte) {
        query.reportDate = dateQuery;
      }
    }

    // 5. Fetch Data
    const total = await ReportOperational.countDocuments(query);

    const reports = await ReportOperational.find(query)
      .populate("voyageId", "voyageNo") 
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
          voyageNo: { $regex: new RegExp(`^${voyageNoString}$`, "i") } 
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
       return NextResponse.json({ error: "Missing Vessel ID or Voyage Number" }, { status: 400 });
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