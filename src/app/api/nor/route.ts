import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";


import mongoose from "mongoose"; // ✅ Import Mongoose
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { put } from "@vercel/blob";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { auth } from "@/auth";
import User from "@/models/User"; 
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage"; 
import ReportOperational from "@/models/ReportOperational";




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
        return NextResponse.json({ error: "File size exceeds the 500 KB limit." }, { status: 400 });
      }
      const filename = `${Date.now()}_${file.name.replace(/\s/g, "_")}`;

      if (process.env.NODE_ENV === "development") {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = path.join(process.cwd(), "public/uploads/nor");
        if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);
        finalDocumentUrl = `/uploads/nor/${filename}`;
      } else {
        const blob = await put(filename, file, { access: "public", addRandomSuffix: true });
        finalDocumentUrl = blob.url;
      }
    }

    const parsedReportDate = parseDateString(reportDate);
    if (!parsedReportDate) {
        return NextResponse.json({ error: "Invalid Date Format." }, { status: 400 });
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
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: "Failed to save record", details: errorMessage }, { status: 500 });
  }
}

// --- GET: FETCH NORS ---
export async function GET(req: Request) {
  try {
    const authz = await authorizeRequest("nor.view");
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const selectedVessel = searchParams.get("vesselId");
    const selectedVoyage = searchParams.get("voyageId");
    const companyId = searchParams.get("companyId"); // ✅ Added to extract companyId

    const query: Record<string, any> = { eventType: "nor" };

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

      // Find all vessels belonging to the user's company
      const companyVessels = await Vessel.find({ company: userCompanyId }).select("_id");
      const companyVesselIds = companyVessels.map((v) => v._id);

      // Restrict query to these vessels only
      query.vesselId = { $in: companyVesselIds };

      // If a specific vessel was selected in UI, verify ownership
      if (selectedVessel) {
        if (companyVesselIds.some((id) => id.toString() === selectedVessel)) {
          query.vesselId = selectedVessel;
        } else {
          // If trying to access unauthorized vessel, return empty result
          return NextResponse.json({
            data: [],
            pagination: { total: 0, page, totalPages: 0 },
          });
        }
      }
    } else {
      // Super Admin Logic
      // 🟢 Logic for SUPER ADMIN with Company Filter
      if (companyId && companyId !== "all") {
        // Find all vessels belonging to the selected company
        const targetVessels = await Vessel.find({ company: companyId }).select("_id");
        const targetVesselIds = targetVessels.map((v) => v._id);

        if (selectedVessel) {
          // If a specific vessel is also selected, ensure it belongs to that company
          if (targetVesselIds.some((id) => id.toString() === selectedVessel)) {
            query.vesselId = selectedVessel;
          } else {
            // Mismatch between selected company and selected vessel
            return NextResponse.json({
              data: [],
              pagination: { total: 0, page, totalPages: 0 },
            });
          }
        } else {
          // Filter reports by all vessels in that company
          query.vesselId = { $in: targetVesselIds };
        }
      } else if (selectedVessel) {
        // Super Admin: Use selectedVessel filter directly if provided (and no company filter active)
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

    // ✅ SEARCH LOGIC
    if (search) {
      query.$or = [
        { vesselName: { $regex: search, $options: "i" } },
        { voyageNo: { $regex: search, $options: "i" } }, 
        { portName: { $regex: search, $options: "i" } },
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

    const total = await ReportOperational.countDocuments(query);

    // ✅ POPULATE VOYAGE ID & AUDIT FIELDS
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
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET NOR ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}