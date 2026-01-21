import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { noonReportSchema } from "@/lib/validations/noonReportSchema";
import { NextRequest, NextResponse } from "next/server";

import { authorizeRequest } from "@/lib/authorizeRequest";

import Company from "@/models/Company";
import ReportDaily from "@/models/ReportDaily";
import User from "@/models/User";
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage";
import mongoose from "mongoose";
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
      ...data, // Spreads data (reports), companies, vessels, voyages, and pagination
      metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        path: "/api//noon-report",
      },
    },
    { status }
  );
};

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

// GET ALL NOON REPORTS

export async function GET(req: NextRequest) {
  try {
    const [authz, _] = await Promise.all([
      authorizeRequest("noon.view"),
      dbConnect(),
    ]);

    if (!authz.ok) {
      return sendResponse(
        403,
        "Forbidden: Insufficient permissions",
        null,
        false
      );
    }

    const session = await auth();
    if (!session?.user) {
      return sendResponse(401, "Unauthorized access", null, false);
    }

    const { user } = session;
    const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
    const userCompanyId = user.company?.id;
    const isAdmin = user.role?.toLowerCase() === "admin";
    const canSeeHistory = user.permissions?.includes("reports.history.views") || isSuperAdmin;
    // Ensure models are registered for population
    const _ensureModels = [Vessel, Voyage, User, Company, ReportDaily];

    const { searchParams } = new URL(req.url);
    const fetchAll = searchParams.get("all") === "true"; // Flag for Dropdowns
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(searchParams.get("limit")) || 10);
    const skip = (page - 1) * limit;

    // ✅ Initialize query with soft-delete filter
    const query: Record<string, any> = { deletedAt: null };


    // 1. Multi-Tenancy Logic
    const selectedVessel = searchParams.get("vesselId");
    const selectedCompany = searchParams.get("companyId");

    if (!isSuperAdmin) {
      if (!userCompanyId)
        return sendResponse(403, "No company assigned to profile", null, false);

      // ✅ Filter Vessels by soft-delete status
      const companyVessels = await Vessel.find({ company: userCompanyId, deletedAt: null })
        .select("_id")
        .lean();
      const companyVesselIds = companyVessels.map((v) => v._id);
      if (isAdmin) {
        // ADMIN LOGIC: Can see all company vessels
        if (selectedVessel) {
          if (companyVesselIds.some((id) => id.toString() === selectedVessel)) {
            query.vesselId = selectedVessel;
          } else {
            return sendResponse(200, "Unauthorized vessel access", { data: [], pagination: { total: 0, page, totalPages: 0 } });
          }
        } else {
          query.vesselId = { $in: companyVesselIds };
        }
      } else {
        // NON-ADMIN LOGIC: Show ONLY their own reports
        query.createdBy = user.id; 
        
        // Still apply vessel filter to ensure they don't see their reports from unauthorized vessels
        if (selectedVessel) {
           query.vesselId = selectedVessel;
        } else {
           query.vesselId = { $in: companyVesselIds };
        }
      }

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
      // Super Admin Logic
      if (selectedCompany && selectedCompany !== "all") {
        // ✅ Filter Vessels by soft-delete status
        const companyVessels = await Vessel.find({ company: selectedCompany, deletedAt: null })
          .select("_id")
          .lean();
        const companyVesselIds = companyVessels.map((v) => v._id);

        if (selectedVessel) {
          if (companyVesselIds.some((id) => id.toString() === selectedVessel)) {
            query.vesselId = selectedVessel;
          } else {
            return sendResponse(200, "Vessel mismatch for company", {
              data: [],
              pagination: { total: 0, page, totalPages: 0 },
            });
          }
        } else {
          query.vesselId = { $in: companyVesselIds };
        }
      } else if (selectedVessel) {
        query.vesselId = selectedVessel;
      }
    }

    // 2. Build Report Filters
    const status = searchParams.get("status");
    if (status && status !== "all") query.status = status;

    const selectedVoyage = searchParams.get("voyageId");
    if (selectedVoyage) query.voyageId = selectedVoyage;

   const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    let manualDateQuery: any = null;

    if (startDate || endDate) {
      manualDateQuery = {};
      const startD = parseDateString(startDate);
      const endD = parseDateString(endDate);
      if (startD) manualDateQuery.$gte = startD;
      if (endD) {
        endD.setHours(23, 59, 59, 999);
        manualDateQuery.$lte = endD;
      }
    }


    if (!canSeeHistory) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const now = new Date();


      query.reportDate = {
        $gte: startOfDay,
        $lte: now,
      };
    } else if (manualDateQuery) {
      
      query.reportDate = manualDateQuery;
    }

    const search = searchParams.get("search")?.trim();
    if (search) {
      // ✅ Wrap search in $and to ensure deletedAt filter is not bypassed
      query.$and = [
        { deletedAt: null },
        {
          $or: [
            { vesselName: { $regex: search, $options: "i" } },
            { voyageNo: { $regex: search, $options: "i" } },
            { "navigation.nextPort": { $regex: search, $options: "i" } },
          ],
        }
      ];
    }

    // 3. Parallel Execution (Main Data + Filter Data)
    const promises: any[] = [
      ReportDaily.countDocuments(query),
      ReportDaily.find(query)
        .populate({
          path: "vesselId",
          select: "name company", // Select name and company ID from Vessel
          populate: {
            path: "company", // Nested populate the Company model
            select: "name", // Only fetch the company name
          },
        })
        .populate("voyageId", "voyageNo")
        .populate("createdBy", "fullName")
        .populate("updatedBy", "fullName")
        .sort({ reportDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ];

    if (fetchAll) {
      // Add Company lookup (✅ Include soft-delete check)
      const companyFilter: any = isSuperAdmin ? { deletedAt: null } : { _id: userCompanyId, deletedAt: null };
      promises.push(
        Company.find(companyFilter)
          .select("_id name status")
          .sort({ name: 1 })
          .lean()
      );

      // Add Vessel lookup (✅ Include soft-delete check)
      const vesselFilter: any = { status: "active", deletedAt: null };
      if (!isSuperAdmin) vesselFilter.company = userCompanyId;
      else if (selectedCompany && selectedCompany !== "all")
        vesselFilter.company = selectedCompany;
      promises.push(
        Vessel.find(vesselFilter)
          .select("_id name company status")
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

    // 4. Process Extra Filter Data (Voyage Mapping)
    if (fetchAll) {
      companies = results[2] || [];
      const rawVessels = (results[3] || []) as any[];
      const vesselIds = rawVessels.map((v) => v._id);

      // ✅ Fetch only non-deleted voyages
      const activeVoyages = await Voyage.find({
        vesselId: { $in: vesselIds },
        status: "active",
        deletedAt: null
      })
        .select("vesselId voyageNo schedule.startDate")
        .lean();

      const voyageMap = new Map<string, string>();
      activeVoyages.forEach((voy) => {
        if (voy.vesselId) voyageMap.set(voy.vesselId.toString(), voy.voyageNo);
      });

      // Map Vessels with activeVoyageNo
      vessels = rawVessels.map((v) => ({
        ...v,
        activeVoyageNo: voyageMap.get(v._id.toString()) || "",
      }));

      // Flatten Voyages for dropdown
      voyages = activeVoyages.map((v) => ({
        _id: v._id,
        vesselId: v.vesselId,
        voyageNo: v.voyageNo,
      }));
    }

    // 5. Standardized Return
    return sendResponse(200, "Noon reports retrieved successfully", {
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
    console.error("GET NOON REPORTS ERROR:", error);
    return sendResponse(
      500,
      error.message || "Internal Server Error",
      null,
      false
    );
  }
}

// CREATE NOON REPORT
export async function POST(req: NextRequest) {
  try {
    const session = await auth(); // ✅ Get session
    const currentUserId = session?.user?.id;
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
        voyageNo: { $regex: new RegExp(`^${voyageNo}$`, "i") },
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
      createdBy: currentUserId,
      updatedBy: currentUserId,

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
