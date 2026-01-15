import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/lib/authorizeRequest";
import { departureReportSchema } from "@/lib/validations/departureReportSchema";
import Company from "@/models/Company";
import ReportOperational from "@/models/ReportOperational";
import User from "@/models/User";
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage";
import mongoose from "mongoose"; // ✅ Import Mongoose
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
const sendResponse = (
  status: number,
  message: string,
  data: any = null,
  success: boolean = true
) => {
  return NextResponse.json(
    {
      success,
      message,
      ...data,
      metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        path: "/api/reports/departure",
      },
    },
    { status }
  );
};

export async function GET(req: NextRequest) {
  try {
    // 1. Authorization & DB Connection
    const authz = await authorizeRequest("departure.view");
    if (!authz.ok) {
      return sendResponse(
        403,
        "Forbidden: Insufficient permissions",
        null,
        false
      );
    }

    await dbConnect();

    // 2. Session & Model Registration
    const session = await auth();
    if (!session?.user) {
      return sendResponse(401, "Unauthorized access", null, false);
    }

    const { user } = session;
    const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
    const userCompanyId = user.company?.id;

    // ✅ Ensure all models are registered for population
    const _ensureModels = [Vessel, Voyage, User, Company, ReportOperational];

    const { searchParams } = new URL(req.url);
    const fetchAll = searchParams.get("all") === "true"; // Flag for Dropdowns
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(searchParams.get("limit")) || 10);
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { eventType: "departure" };

    // =========================================================
    // 🔒 3. MULTI-TENANCY FILTERING LOGIC
    // =========================================================
    const selectedVessel = searchParams.get("vesselId");
    const selectedCompany = searchParams.get("companyId");

    if (!isSuperAdmin) {
      if (!userCompanyId)
        return sendResponse(403, "No company assigned", null, false);

      const companyVessels = await Vessel.find({ company: userCompanyId })
        .select("_id")
        .lean();
      const companyVesselIds = companyVessels.map((v) => v._id);

      if (selectedVessel) {
        if (companyVesselIds.some((id) => id.toString() === selectedVessel)) {
          query.vesselId = selectedVessel;
        } else {
          return sendResponse(200, "Unauthorized vessel access", {
            data: [],
            pagination: { total: 0, page, totalPages: 0 },
          });
        }
      } else {
        query.vesselId = { $in: companyVesselIds };
      }
    } else {
      if (selectedCompany && selectedCompany !== "all") {
        const targetVessels = await Vessel.find({ company: selectedCompany })
          .select("_id")
          .lean();
        const targetVesselIds = targetVessels.map((v) => v._id);

        if (selectedVessel) {
          if (targetVesselIds.some((id) => id.toString() === selectedVessel)) {
            query.vesselId = selectedVessel;
          } else {
            return sendResponse(200, "Vessel mismatch", {
              data: [],
              pagination: { total: 0, page, totalPages: 0 },
            });
          }
        } else {
          query.vesselId = { $in: targetVesselIds };
        }
      } else if (selectedVessel) {
        query.vesselId = selectedVessel;
      }
    }

    // =========================================================
    // 🔍 4. APPLY ADDITIONAL FILTERS
    // =========================================================
    const status = searchParams.get("status") || "all";
    if (status !== "all") query.status = status;

    const selectedVoyage = searchParams.get("voyageId");
    if (selectedVoyage) query.voyageId = selectedVoyage;

    const search = searchParams.get("search")?.trim();
    if (search) {
      query.$or = [
        { vesselName: { $regex: search, $options: "i" } },
        { voyageNo: { $regex: search, $options: "i" } },
        { portName: { $regex: search, $options: "i" } },
      ];
    }

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate || endDate) {
      const dateQuery: any = {};
      const startD = parseDateString(startDate);
      const endD = parseDateString(endDate);
      if (startD) dateQuery.$gte = startD;
      if (endD) {
        endD.setHours(23, 59, 59, 999);
        dateQuery.$lte = endD;
      }
      query.reportDate = dateQuery;
    }

    // =========================================================
    // 🚀 5. PARALLEL EXECUTION (MAIN DATA + FILTERS)
    // =========================================================
    const promises: any[] = [
      ReportOperational.countDocuments(query),
      ReportOperational.find(query)
        .populate("voyageId", "voyageNo")
        .populate({
          path: "vesselId",
          select: "name company", // Select name and company ID from Vessel
          populate: {
            path: "company", // Nested populate Company model
            select: "name", // Only fetch the company name
          },
        })
        .populate("createdBy", "fullName")
        .populate("updatedBy", "fullName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ];

    if (fetchAll) {
      const companyFilter = isSuperAdmin ? {} : { _id: userCompanyId };
      promises.push(
        Company.find(companyFilter)
          .select("_id name status")
          .sort({ name: 1 })
          .lean()
      );

      const vesselFilter: any = { status: "active" };
      if (!isSuperAdmin) vesselFilter.company = userCompanyId;
      else if (selectedCompany && selectedCompany !== "all")
        vesselFilter.company = selectedCompany;
      promises.push(
        Vessel.find(vesselFilter)
          .select("_id name status")
          .sort({ name: 1 })
          .lean()
      );
    }

    const results = await Promise.all(promises);
    const total = results[0];
    const reports = results[1];

    let companies: any[] = [];
    let vessels: any[] = [];
    let voyages: any[] = [];

    // =========================================================
    // 🌟 6. PROCESS FILTER DATA (VOYAGE MAPPING)
    // =========================================================
    if (fetchAll) {
      companies = results[2] || [];
      const rawVessels = (results[3] || []) as any[];
      const vIds = rawVessels.map((v) => v._id);

      const activeVoyages = await Voyage.find({
        vesselId: { $in: vIds },
        status: "active",
      })
        .select("vesselId voyageNo")
        .lean();

      const voyageMap = new Map<string, string>();
      activeVoyages.forEach((voy: any) => {
        if (voy.vesselId) voyageMap.set(voy.vesselId.toString(), voy.voyageNo);
      });

      vessels = rawVessels.map((v: any) => ({
        ...v,
        activeVoyageNo: voyageMap.get(v._id.toString()) || "",
      }));

      voyages = activeVoyages.map((v) => ({
        _id: v._id,
        vesselId: v.vesselId,
        voyageNo: v.voyageNo,
      }));
    }

    return sendResponse(200, "Departure reports retrieved successfully", {
      data: reports,
      companies,
      vessels,
      voyages,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET DEPARTURE REPORTS ERROR:", error);
    return sendResponse(
      500,
      error.message || "Internal Server Error",
      null,
      false
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
    if (body.bunkers_received_vlsfo_mt === "")
      body.bunkers_received_vlsfo_mt = 0;
    if (body.bunkers_received_lsmgo_mt === "")
      body.bunkers_received_lsmgo_mt = 0;

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
      return NextResponse.json(
        { error: "Invalid Date Format" },
        { status: 400 }
      );
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
