import { dbConnect } from "@/lib/db";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { authorizeRequest } from "@/lib/authorizeRequest";
import Company from "@/models/Company";
import ReportOperational from "@/models/ReportOperational";
import User from "@/models/User";
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage";
import { put } from "@vercel/blob";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import mongoose from "mongoose"; // ✅ Import Mongoose
import path from "path";
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

      ...data, // Spreads pagination, data, companies, etc.
      metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        path: "/api/nor",
      },
    },
    { status }
  );
};

// ... (keep parseDateString helper exactly as is) ...
function parseDateString(dateStr: string | null | undefined): Date | undefined {
  if (!dateStr) return undefined;
  if (typeof dateStr === "string" && dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return date;
    }
  }
  const fallbackDate = new Date(dateStr);
  return isNaN(fallbackDate.getTime()) ? undefined : fallbackDate;
}

// --- GET: FETCH NORS ---
export async function GET(req: Request) {
  try {
    const authz = await authorizeRequest("nor.view");
    if (!authz.ok) {
      return sendResponse(
        403,
        "Forbidden: Insufficient permissions",
        null,
        false
      );
    }

    await dbConnect();

    // 🔒 1. Session & Multi-Tenancy Setup
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = session;
    const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
    const userCompanyId = user.company?.id;

    const _ensureModels = [Vessel, Voyage, User, Company]; // Added Company to ensure model registration

    const { searchParams } = new URL(req.url);
    const fetchAll = searchParams.get("all") === "true"; // 🟢 Capture dropdown flag
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const canSeeHistory = user.permissions?.includes("reports.history.views") || isSuperAdmin;
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
  const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    let manualDateRange: any = null;
    const selectedVessel = searchParams.get("vesselId");
    const selectedVoyage = searchParams.get("voyageId");
    const companyId = searchParams.get("companyId");

    // ✅ Initialize query with soft-delete filter
    const query: Record<string, any> = { eventType: "nor", deletedAt: null };

    // =========================================================
    // 🔒 MULTI-TENANCY FILTERING LOGIC
    // =========================================================
    if (!isSuperAdmin) {
      if (!userCompanyId) {
        return NextResponse.json(
          { error: "Access denied: No company assigned to your profile." },
          { status: 403 }
        );
      }

      const companyVessels = await Vessel.find({
        company: userCompanyId,
        deletedAt: null, // ✅ Filter out soft-deleted vessels
      }).select("_id");
      const companyVesselIds = companyVessels.map((v) => v._id);

      query.vesselId = { $in: companyVesselIds };

      if (selectedVessel) {
        if (companyVesselIds.some((id) => id.toString() === selectedVessel)) {
          query.vesselId = selectedVessel;
        } else {
          return NextResponse.json({
            data: [],
            pagination: { total: 0, page, totalPages: 0 },
          });
        }
      }
    } else {
      if (companyId && companyId !== "all") {
        const targetVessels = await Vessel.find({ 
          company: companyId,
          deletedAt: null // ✅ Filter out soft-deleted vessels
        }).select("_id");
        const targetVesselIds = targetVessels.map((v) => v._id);

        if (selectedVessel) {
          if (targetVesselIds.some((id) => id.toString() === selectedVessel)) {
            query.vesselId = selectedVessel;
          } else {
            return NextResponse.json({
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

    if (status !== "all") {
      query.status = status;
    }

    if (selectedVoyage) {
      query.voyageId = selectedVoyage;
    }

    if (search) {
      // ✅ Use $and to combine soft-delete filter with keyword search
      query.$and = [
        { deletedAt: null },
        {
          $or: [
            { vesselName: { $regex: search, $options: "i" } },
            { voyageNo: { $regex: search, $options: "i" } },
            { portName: { $regex: search, $options: "i" } },
          ],
        }
      ];
    }

    if (startDate || endDate) {
      manualDateRange = {};
      const s = parseDateString(startDate);
      const e = parseDateString(endDate);
      if (s) manualDateRange.$gte = s;
      if (e) {
        e.setHours(23, 59, 59, 999);
        manualDateRange.$lte = e;
      }
    }

    // 2. Apply History Restriction (Security) OR Manual Filters
    if (!canSeeHistory) {
      // Force "Today" for restricted users
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const now = new Date();

      query.reportDate = {
        $gte: startOfDay,
        $lte: now,
      };
    } else if (manualDateRange) {
      // Allow selected range for Admin/History users
      query.reportDate = manualDateRange;
    }

    // =========================================================
    // 🚀 EXECUTE QUERIES (Combined with Vessel Dropdown logic)
    // =========================================================
    const promises: any[] = [
      ReportOperational.countDocuments(query),
      ReportOperational.find(query)
        .populate("voyageId", "voyageNo")
        .populate({
          path: "vesselId",
          select: "name company", 
          populate: {
            path: "company", 
            select: "name", 
          },
        })
        .populate("createdBy", "fullName")
        .populate("updatedBy", "fullName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ];

    // 🟢 Step: Add Filter lists if fetchAll is true
    if (fetchAll) {
      const companyFilter: any = isSuperAdmin ? { deletedAt: null } : { _id: userCompanyId, deletedAt: null };
      promises.push(
        Company.find(companyFilter)
          .select("_id name status")
          .sort({ name: 1 })
          .lean()
      );

      const vesselFilter: any = { status: "active", deletedAt: null };
      if (!isSuperAdmin) vesselFilter.company = userCompanyId;
      else if (companyId && companyId !== "all")
        vesselFilter.company = companyId;
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

    // 🌟 5. Process Extra Dropdown Data (Same as Vessel/Cargo Logic)
    if (fetchAll) {
      companies = results[2] || [];
      const rawVessels = results[3] || [];
      const vesselIds = rawVessels.map((v: any) => v._id);

      const activeVoyages = await Voyage.find({
        vesselId: { $in: vesselIds },
        status: "active",
        deletedAt: null // ✅ Ensure only active, non-deleted voyages are used
      })
        .select("vesselId voyageNo schedule.startDate")
        .lean();

      const voyageMap = new Map();
      activeVoyages.forEach((voy) => {
        voyageMap.set(voy.vesselId.toString(), voy.voyageNo);
      });

      vessels = rawVessels.map((v: any) => ({
        ...v,
        activeVoyageNo: voyageMap.get(v._id.toString()) || "",
      }));

      voyages = activeVoyages.map((voy) => ({
        _id: voy._id,
        vesselId: voy.vesselId,
        voyageNo: voy.voyageNo,
      }));
    }

    // FINAL STANDARDIZED SUCCESS RESPONSE
    return sendResponse(200, "Operational reports retrieved successfully", {
      data: reports,
      companies,
      vessels,
      voyages,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET NOR ERROR:", error);
    return sendResponse(500, "Failed to fetch data", null, false);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth(); // ✅ Get session
    const currentUserId = session?.user?.id;
    const authz = await authorizeRequest("nor.create");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const formData = await req.formData();

    // Extract Fields
    // ✅ 1. Get vesselId from form data
    const vesselIdString = formData.get("vesselId") as string;
    const vesselName = formData.get("vesselName") as string;

    // This is the string (e.g. "OP-1225") from the frontend dropdown
    const voyageNoString = formData.get("voyageNo") as string;

    const portName = formData.get("portName") as string;
    const remarks = formData.get("remarks") as string;
    const reportDate = formData.get("reportDate") as string;

    // NOR Specific Fields
    const pilotStation = formData.get("pilotStation") as string;
    const norTenderTime = formData.get("norTenderTime") as string;
    const etaPort = formData.get("etaPort") as string;

    // Handle File (Keep your existing file upload logic)
    const file = formData.get("norDocument") as File | null;
    let finalDocumentUrl = "";

    if (file && file.size > 0) {
      if (file.size > 500 * 1024) {
        return NextResponse.json(
          { error: "File size exceeds the 500 KB limit." },
          { status: 400 }
        );
      }
      const filename = `${Date.now()}_${file.name.replace(/\s/g, "_")}`;

      if (process.env.NODE_ENV === "development") {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = path.join(process.cwd(), "public/uploads/nor");
        if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);
        finalDocumentUrl = `/uploads/nor/${filename}`;
      } else {
        const blob = await put(filename, file, {
          access: "public",
          addRandomSuffix: true,
        });
        finalDocumentUrl = blob.url;
      }
    }

    const parsedReportDate = parseDateString(reportDate);
    if (!parsedReportDate) {
      return NextResponse.json(
        { error: "Invalid Date Format." },
        { status: 400 }
      );
    }

    // ==========================================
    // ✅ 2. VOYAGE ID LOOKUP LOGIC
    // ==========================================
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

    // Create Record
    const newRecord = await ReportOperational.create({
      eventType: "nor",
      status: "active",
      createdBy: currentUserId,
      updatedBy: currentUserId,
      // ✅ IDs
      vesselId: vesselIdString,
      voyageId: voyageObjectId,

      // ✅ Snapshots
      vesselName,
      voyageNo: voyageNoString, // Save string for snapshot

      portName,
      eventTime: norTenderTime ? new Date(norTenderTime) : new Date(),
      reportDate: parsedReportDate,

      norDetails: {
        pilotStation: pilotStation,
        documentUrl: finalDocumentUrl,
        etaPort: etaPort ? new Date(etaPort) : undefined,
        tenderTime: norTenderTime ? new Date(norTenderTime) : undefined,
      },

      remarks,
      navigation: {},
      departureStats: {},
      arrivalStats: {},
    });

    return NextResponse.json(
      { message: "NOR saved successfully", data: newRecord },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error saving NOR:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: "Failed to save record", details: errorMessage },
      { status: 500 }
    );
  }
}
