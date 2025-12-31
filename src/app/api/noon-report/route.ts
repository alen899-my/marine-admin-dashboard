
import { dbConnect } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth"; 
import { noonReportSchema } from "@/lib/validations/noonReportSchema";
import ReportDaily from "@/models/ReportDaily";
import { authorizeRequest } from "@/lib/authorizeRequest";
import Voyage from "@/models/Voyage";
import mongoose from "mongoose";


function parseDateString(dateStr: string | null | undefined): Date | undefined {
  if (!dateStr) return undefined;

  // Check if string matches dd/mm/yyyy format (simple check)
  if (typeof dateStr === "string" && dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; 
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

//  GET ALL NOON REPORTS
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (status !== "all") {
      query.status = status;
    }

   if (search) {
      query.$or = [
        { vesselName: { $regex: search, $options: "i" } },
        { voyageNo: { $regex: search, $options: "i" } }, // Search the snapshot string
        { "navigation.nextPort": { $regex: search, $options: "i" } },
      ];
    }

    if (startDate || endDate) {
      const dateQuery: { $gte?: Date; $lte?: Date } = {};
      if (startDate) {
        const parsedStart = parseDateString(startDate);
        if (parsedStart) dateQuery.$gte = parsedStart;
      }
      if (endDate) {
        const parsedEnd = parseDateString(endDate);
        if (parsedEnd) {
          parsedEnd.setHours(23, 59, 59, 999);
          dateQuery.$lte = parsedEnd;
        }
      }
      if (dateQuery.$gte || dateQuery.$lte) {
        query.reportDate = dateQuery;
      }
    }

    const total = await ReportDaily.countDocuments(query);

    const reports = await ReportDaily.find(query)
  
      .populate("vesselId", "name") 
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
  } catch (error: unknown) {
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
    const authz = await authorizeRequest("noon.create");
    if (!authz.ok) return authz.response;
    
    await dbConnect();
    const body = await req.json();
    

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

    const {
      vesselName,
      vesselId, 
      voyageNo, 
      reportDate,
      nextPort,
      latitude,
      longitude,
      distanceTravelled,
      engineDistance,
      slip,
      distanceToGo,
      vlsfoConsumed,
      lsmgoConsumed,
      windForce,
      seaState,
      weatherRemarks,
      generalRemarks,
    } = value;

    const parsedReportDate = parseDateString(reportDate);
    
    if (!parsedReportDate) {
      return NextResponse.json(
        { error: "Invalid Date Format. Please use dd/mm/yyyy" },
        { status: 400 }
      );
    }

    // 2. ✅ ROBUST VOYAGE LOOKUP
    let voyageObjectId = null;
    
    if (vesselId && voyageNo) {
      // Convert to ObjectId to ensure match
      const vId = new mongoose.Types.ObjectId(vesselId);

      const foundVoyage = await Voyage.findOne({ 
        vesselId: vId, 
        // Case-insensitive match for voyageNo
        voyageNo: { $regex: new RegExp(`^${voyageNo}$`, "i") } 
      }).select("_id");

      if (foundVoyage) {
        voyageObjectId = foundVoyage._id;
      } else {
        return NextResponse.json(
          { error: `Voyage ${voyageNo} not found for this vessel.` },
          { status: 404 }
        );
      }
    } else {
        return NextResponse.json(
          { error: `Missing Vessel ID or Voyage Number` },
          { status: 400 }
        );
    }

    // 3. SAVE REPORT
    const report = await ReportDaily.create({
     vesselId: new mongoose.Types.ObjectId(vesselId),       
      voyageId: voyageObjectId,
      vesselName,   
      voyageNo,      

      type: "noon",
      status: "active",
      reportDate: parsedReportDate,

      position: {
        lat: latitude,
        long: longitude,
      },

      navigation: {
        distLast24h: Number(distanceTravelled ?? 0),
        engineDist: Number(engineDistance ?? 0),
        slip: slip !== "" ? Number(slip) : null,
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
    console.error("NOON REPORT ERROR →", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}