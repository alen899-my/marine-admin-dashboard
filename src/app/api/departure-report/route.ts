import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { auth } from "@/auth";


import mongoose from "mongoose"; // ✅ Import Mongoose
import User from "@/models/User"; 
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage"; 
import ReportOperational from "@/models/ReportOperational";

// VALIDATION
import { departureReportSchema } from "@/lib/validations/departureReportSchema";
import { authorizeRequest } from "@/lib/authorizeRequest";
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


export async function GET(req: NextRequest) {
 
  try {
    const t1 = performance.now();
    const authz = await authorizeRequest("departure.view");
    if (!authz.ok) return authz.response;
    await dbConnect();
   

    // 🔒 1. Session & Multi-Tenancy Setup
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = session;
    const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
    const userCompanyId = user.company?.id;

    const _ensureModels = [Vessel, Voyage, User];
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
    const companyId = searchParams.get("companyId"); // ✅ Added to extract companyId

    // 2. Initialize Query
    const query: Record<string, any> = { eventType: "departure" };

    // =========================================================
    // 🔒 MULTI-TENANCY FILTERING LOGIC
    // =========================================================
    const t2 = performance.now();
    if (!isSuperAdmin) {
      if (!userCompanyId) {
        return NextResponse.json(
          { error: "Access denied: No company assigned to your profile." },
          { status: 403 }
        );
      }

      // Step A: Find all vessels belonging to the user's company
      const companyVessels = await Vessel.find({ company: userCompanyId }).select("_id").lean();
      const companyVesselIds = companyVessels.map((v) => v._id);

      // Step B: Restrict the query to only these vessels
      query.vesselId = { $in: companyVesselIds };

      // Step C: If a specific vesselId was requested, ensure it belongs to the user's company
      if (selectedVessel) {
        if (companyVesselIds.some((id) => id.toString() === selectedVessel)) {
          query.vesselId = selectedVessel;
        } else {
          // If trying to access unauthorized vessel, return empty result
          return NextResponse.json({
            data: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
          });
        }
      }
    } else {
      // Super Admin: Use the vesselId param directly if provided
      // 🟢 Logic for SUPER ADMIN with Company Filter
      if (companyId && companyId !== "all") {
        // Find all vessels belonging to the selected company
        const targetVessels = await Vessel.find({ company: companyId }).select("_id").lean();
        const targetVesselIds = targetVessels.map((v) => v._id);

        if (selectedVessel) {
          // If a specific vessel is also selected, ensure it belongs to that company
          if (targetVesselIds.some((id) => id.toString() === selectedVessel)) {
            query.vesselId = selectedVessel;
          } else {
            // Mismatch between selected company and selected vessel
            return NextResponse.json({
              data: [],
              pagination: { page, limit, total: 0, totalPages: 0 },
            });
          }
        } else {
          // Filter reports by all vessels in that company
          query.vesselId = { $in: targetVesselIds };
        }
      } else if (selectedVessel) {
        query.vesselId = selectedVessel;
      }
    }
 
    // =========================================================

    // 3. Apply Filters
    if (status !== "all") {
      query.status = status;
    }
    
    if (selectedVoyage) {
      query.voyageId = selectedVoyage;
    }

    if (search) {
      query.$or = [
        { vesselName: { $regex: search, $options: "i" } },
        { voyageNo: { $regex: search, $options: "i" } },
        { portName: { $regex: search, $options: "i" } },
      ];
    }

    // 4. Date Filter
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

    // 5. Fetch Data
    const t3 = performance.now();
    // ✅ Note: Consider using Promise.all here if count + find takes too long
    const total = await ReportOperational.countDocuments(query);

    const reports = await ReportOperational.find(query)
      .populate("voyageId", "voyageNo")
      .populate("vesselId", "name")
      .populate("createdBy", "fullName") 
      .populate("updatedBy", "fullName") 
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
    const session = await auth(); // ✅ Get session
    const currentUserId = session?.user?.id;
    const authz = await authorizeRequest("departure.create");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const body = await req.json();

    // Sanitize Empty Strings
    if (body.cargo_qty_loaded_mt === "") body.cargo_qty_loaded_mt = 0;
    if (body.cargo_qty_unloaded_mt === "") body.cargo_qty_unloaded_mt = 0;
    if (body.bunkers_received_vlsfo_mt === "") body.bunkers_received_vlsfo_mt = 0;
    if (body.bunkers_received_lsmgo_mt === "") body.bunkers_received_lsmgo_mt = 0;

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

    const parsedReportDate = parseDateString(value.reportDate);
    if (!parsedReportDate) {
      return NextResponse.json({ error: "Invalid Date Format" }, { status: 400 });
    }

    // ==========================================
    // ✅ VOYAGE ID LOOKUP LOGIC
    // ==========================================
    const voyageNoString = value.voyageId; // Frontend sends string "OP-1225-IN" here
    const vesselIdString = value.vesselId;
    let voyageObjectId = null;

    if (vesselIdString && voyageNoString) {
      const vId = new mongoose.Types.ObjectId(vesselIdString);

      // Find the Voyage Document to get its _id
      const foundVoyage = await Voyage.findOne({
        vesselId: vId,
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
    // CREATE REPORT
    // ==========================================
    const report = await ReportOperational.create({
      eventType: "departure",
      status: "active",
      createdBy: currentUserId, // ✅ Store creator
      updatedBy: currentUserId, // ✅ Store initial updater

      // ✅ IDS (Linked)
      vesselId: vesselIdString,
      voyageId: voyageObjectId, // Saved as ObjectId (e.g. 65a...)

      // ✅ SNAPSHOTS (Readable)
      vesselName: value.vesselName,
      voyageNo: voyageNoString, // Saved as String (e.g. "OP-1225-IN")

      portName: value.portName,
      lastPort: value.lastPort,
      eventTime: new Date(value.eventTime),
      reportDate: parsedReportDate,

      navigation: {
        distanceToNextPortNm: value.distance_to_next_port_nm,
        etaNextPort: value.etaNextPort ? new Date(value.etaNextPort) : null,
      },

      departureStats: {
        robVlsfo: value.robVlsfo,
        robLsmgo: value.robLsmgo,
        bunkersReceivedVlsfo: value.bunkers_received_vlsfo_mt || 0,
        bunkersReceivedLsmgo: value.bunkers_received_lsmgo_mt || 0,
        cargoQtyLoadedMt: value.cargo_qty_loaded_mt || 0,
        cargoQtyUnloadedMt: value.cargo_qty_unloaded_mt || 0,
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
