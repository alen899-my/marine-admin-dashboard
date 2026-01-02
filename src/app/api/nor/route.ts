import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import ReportOperational from "@/models/ReportOperational";
import Voyage from "@/models/Voyage"; // ✅ Import Voyage
import mongoose from "mongoose"; // ✅ Import Mongoose
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { put } from "@vercel/blob";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { auth } from "@/auth";
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
    await dbConnect();

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


    const query: Record<string, unknown> = { eventType: "nor" };

    if (status !== "all") {
      query.status = status;
    }
     if (selectedVessel) query.vesselId = selectedVessel;
          if (selectedVoyage) {
          query.voyageId = selectedVoyage;
        }

    // 1. ✅ FIX SEARCH LOGIC
    if (search) {
      query.$or = [
        { vesselName: { $regex: search, $options: "i" } },
        // Search 'voyageNo' (string), NOT 'voyageId' (ObjectId)
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

    // 2. ✅ POPULATE VOYAGE ID
    const reports = await ReportOperational.find(query)
      .populate("voyageId", "voyageNo") 
      .populate("vesselId", "name")
      .populate("createdBy", "fullName") // ✅ Add this
    .populate("updatedBy", "fullName") // ✅ Add this
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