import { dbConnect } from "@/lib/db";

import { auth } from "@/auth";
import { authorizeRequest } from "@/lib/authorizeRequest";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { arrivalReportSchema } from "@/lib/validations/arrivalReportSchema";
import ReportDaily from "@/models/ReportDaily";
import ReportOperational from "@/models/ReportOperational";
import User from "@/models/User";
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage";

import Company from "@/models/Company";


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
        path: "/api/reports/arrival",
      },
    },
    { status }
  );
};

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

export async function GET(req: NextRequest) {
  try {
    const authz = await authorizeRequest("arrival.view");
    if (!authz.ok) return authz.response;
    await dbConnect();

    // 🔒 1. Session & Multi-Tenancy Setup
    const session = await auth();
    if (!session || !session.user) {
      return sendResponse(401, "Unauthorized", null, false);
    }

    const { user } = session;
    const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
    const userCompanyId = user.company?.id;

    // Ensure models are registered for populate
    const _ensureModels = [Vessel, Voyage, User, ReportDaily, Company, ReportOperational];

    const { searchParams } = new URL(req.url);
    // 🟢 ROMAN I: Fetch Flag Addition
    const fetchAll = searchParams.get("all") === "true"; 
    
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;
    const canSeeHistory = user.permissions?.includes("reports.history.views") || isSuperAdmin;

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const vesselIdParam = searchParams.get("vesselId");
    const voyageIdParam = searchParams.get("voyageId");
    const companyIdParam = searchParams.get("companyId");

    const query: any = { eventType: "arrival" };
    //history reports logics 
    if (!canSeeHistory) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const now = new Date();

  
  query.reportDate = {
    $gte: startOfDay,
    $lte: now, 
  };
}

    // =========================================================
    // 🔒 2. MULTI-TENANCY FILTERING LOGIC (Same as original)
    // =========================================================
    if (!isSuperAdmin) {
      if (!userCompanyId) return sendResponse(403, "Access denied: No company assigned", null, false);
      const companyVessels = await Vessel.find({ company: userCompanyId }).select("_id").lean();
      const companyVesselIds = companyVessels.map((v) => v._id.toString());
      query.vesselId = { $in: companyVesselIds };

      if (vesselIdParam) {
        if (companyVesselIds.includes(vesselIdParam)) {
          query.vesselId = vesselIdParam;
        } else {
          return sendResponse(200, "Success", { data: [], pagination: { total: 0, page, totalPages: 0 } });
        }
      }
    } else {
      if (companyIdParam && companyIdParam !== "all") {
        const targetVessels = await Vessel.find({ company: companyIdParam }).select("_id").lean();
        const targetVesselIds = targetVessels.map((v) => v._id.toString());
        if (vesselIdParam) {
          query.vesselId = targetVesselIds.includes(vesselIdParam) ? vesselIdParam : { $in: [] };
        } else {
          query.vesselId = { $in: targetVesselIds };
        }
      } else if (vesselIdParam) {
        query.vesselId = vesselIdParam;
      }
    }

    if (status !== "all") query.status = status;
    if (voyageIdParam) query.voyageId = voyageIdParam;

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
      if (e) { e.setHours(23, 59, 59, 999); dateQuery.$lte = e; }
      if (Object.keys(dateQuery).length) query.reportDate = dateQuery;
    }

    // =========================================================
    // 🚀 3. ROMAN II: PARALLEL EXECUTION (Main Data + Dropdowns)
    // =========================================================
    const promises: Promise<any>[] = [
      ReportOperational.countDocuments(query),
      ReportOperational.find(query)
        .populate("voyageId", "voyageNo _id")
        .populate("vesselId", "name")
        .populate("createdBy", "fullName")
        .populate("updatedBy", "fullName")
        .populate({
        path: "vesselId",
        select: "name company",
        populate: {
          path: "company",
          select: "name",
        },
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ];

    if (fetchAll) {
      // Fetch Companies
      const companyFilter = isSuperAdmin ? {} : { _id: userCompanyId };
      promises.push(Company.find(companyFilter).select("_id name status").sort({ name: 1 }).lean());

      // Fetch Vessels
      const vesselFilter: any = { status: "active" };
      if (!isSuperAdmin) vesselFilter.company = userCompanyId;
      else if (companyIdParam && companyIdParam !== "all") vesselFilter.company = companyIdParam;
      promises.push(Vessel.find(vesselFilter).select("_id name status").sort({ name: 1 }).lean());
    }

    // 🟢 ROMAN III: Strict Type Casting for results
    const results = await Promise.all(promises) as [number, any[], any[]?, any[]?];
    const total = results[0];
    const arrivals = results[1];
    
    let companies: any[] = [];
    let vessels: any[] = [];
    let voyages: any[] = [];
    let reportsWithMetrics: any[] = [];

    // =========================================================
    // 📊 4. BULK METRICS CALCULATION (Your Original Logic)
    // =========================================================
    if (arrivals.length > 0) {
        const voyageIds = arrivals.map((r: any) => r.voyageId?._id).filter(Boolean);

        const [departures, noonReports] = await Promise.all([
            ReportOperational.find({ voyageId: { $in: voyageIds }, eventType: "departure", status: "active" }).lean(),
            ReportDaily.find({ voyageId: { $in: voyageIds }, status: "active" }).lean()
        ]);

        const departureMap = new Map(departures.map((d: any) => [d.voyageId.toString(), d]));
        const noonMap = new Map<string, any[]>();
        noonReports.forEach((n: any) => {
            const id = n.voyageId.toString();
            if (!noonMap.has(id)) noonMap.set(id, []);
            noonMap.get(id)!.push(n);
        });

        reportsWithMetrics = arrivals.map((report: any) => {
            const vId = report.voyageId?._id?.toString();
            if (!vId) return { ...report, metrics: null };

            const departure = departureMap.get(vId);
            if (!departure) return { ...report, metrics: null };

            const arrTime = new Date(report.eventTime || report.reportDate).getTime();
            const depTime = new Date(departure.eventTime || departure.reportDate).getTime();

            const noonList = (noonMap.get(vId) || []).filter((n: any) => {
                const noonTime = new Date(n.reportDate).getTime();
                return noonTime >= (depTime - 3600000) && noonTime <= (arrTime + 3600000);
            });

            const totalTimeHours = Math.max(0, (arrTime - depTime) / 36e5);
            // 🟢 Fix Reduce Types
            const totalDistance = noonList.reduce((sum: number, n: any) => sum + (Number(n.navigation?.distLast24h) || 0), 0);

            const fuel = (t: string) => {
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
                    avgSpeed: totalTimeHours > 0 ? +(totalDistance / totalTimeHours).toFixed(2) : 0,
                    consumedVlsfo: +fuel("Vlsfo").toFixed(2),
                    consumedLsmgo: +fuel("Lsmgo").toFixed(2),
                },
            };
        });
    }

    // =========================================================
    // 🌟 5. ROMAN IV: Dropdown Data Processing (Vessel Join)
    // =========================================================
    if (fetchAll) {
      companies = results[2] || [];
      const rawVessels = results[3] || [];
      const vIds = rawVessels.map((v: any) => v._id);

      const activeVoyages = await Voyage.find({ vesselId: { $in: vIds }, status: "active" })
        .select("vesselId voyageNo").lean();

      const voyMap = new Map(activeVoyages.map((v: any) => [v.vesselId.toString(), v.voyageNo]));
      
      vessels = rawVessels.map((v: any) => ({
        ...v,
        activeVoyageNo: voyMap.get(v._id.toString()) || "", 
      }));

      voyages = activeVoyages; 
    }

    return sendResponse(200, "Arrival reports retrieved successfully", {
      data: reportsWithMetrics.length > 0 ? reportsWithMetrics : arrivals,
      companies,
      vessels,
      voyages,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });

  } catch (error: any) {
    console.error("GET ARRIVAL ERROR →", error);
    return sendResponse(500, "Internal Server Error", { error: error.message }, false);
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
