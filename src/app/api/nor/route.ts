import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import ReportOperational from "@/models/ReportOperational";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { put } from "@vercel/blob";

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

export async function POST(req: Request) {
  try {
    await dbConnect();
    const formData = await req.formData();

    // Extract Fields
    const vesselName = formData.get("vesselName") as string;
    const voyageId = formData.get("voyageNo") as string;
    const portName = formData.get("portName") as string;
    const remarks = formData.get("remarks") as string;
    const reportDate = formData.get("reportDate") as string;

    // NOR Specific Fields
    const pilotStation = formData.get("pilotStation") as string;
    const norTenderTime = formData.get("norTenderTime") as string;
    const etaPort = formData.get("etaPort") as string;

    // Handle File
    const file = formData.get("norDocument") as File | null;
    let finalDocumentUrl = "";

    if (file && file.size > 0) {
      // 500KB Validation
      if (file.size > 500 * 1024) {
        return NextResponse.json(
          { error: "File size exceeds the 500 KB limit." },
          { status: 400 }
        );
      }

      const filename = `${Date.now()}_${file.name.replace(/\s/g, "_")}`;

      // --- CONDITIONAL UPLOAD LOGIC ---
      if (process.env.NODE_ENV === "development") {
        // --- LOCAL STORAGE (Development) ---
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = path.join(process.cwd(), "public/uploads/nor");

        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        await writeFile(path.join(uploadDir, filename), buffer);
        finalDocumentUrl = `/uploads/nor/${filename}`;
      } else {
        // --- VERCEL BLOB (Production) ---
        const blob = await put(filename, file, {
          access: "public",
          addRandomSuffix: true,
        });
        finalDocumentUrl = blob.url;
      }
    }

    // ✅ PARSE DATE safely here
    const parsedReportDate = parseDateString(reportDate);

    if (!parsedReportDate) {
        return NextResponse.json(
            { error: "Invalid Date Format. Please use dd/mm/yyyy" }, 
            { status: 400 }
        );
    }

    // Create Record
    const newRecord = await ReportOperational.create({
      voyageId,
      eventType: "nor",
      vesselName,
      portName,
      eventTime: norTenderTime ? new Date(norTenderTime) : new Date(),
      
      // ✅ Use the parsed date object
      reportDate: parsedReportDate,
      
      norDetails: {
        pilotStation: pilotStation,
        documentUrl: finalDocumentUrl,
        etaPort: etaPort ? new Date(etaPort) : undefined,
        tenderTime: norTenderTime ? new Date(norTenderTime) : undefined,
      },

      remarks,
      status: "active",

      navigation: {},
      departureStats: {},
      arrivalStats: {},
    });

    return NextResponse.json(
      { message: "NOR saved successfully", data: newRecord },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Fixed: Use 'unknown' type and narrow safely
    console.error("Error saving NOR:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: "Failed to save record", details: errorMessage },
      { status: 500 }
    );
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

    // 1. Get Search & Status Params
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    
    // ✅ Date Filter Addition: Extract Dates
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 2. Build Query (Base: NOR)
    // Fixed: Use Record<string, unknown> instead of 'any' to satisfy lint
    const query: Record<string, unknown> = { eventType: "nor" };

    // 3. Apply Status Filter
    if (status !== "all") {
      query.status = status;
    }

    // 4. Apply Search Filter
    if (search) {
      query.$or = [
        { vesselName: { $regex: search, $options: "i" } },
        { voyageId: { $regex: search, $options: "i" } },
        { portName: { $regex: search, $options: "i" } },
      ];
    }
    
    // ✅ Date Filter Addition: Apply Date Range Query
    if (startDate || endDate) {
      // Define a typed object for the date query
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

      // Assign the typed object to the query
      if (dateQuery.$gte || dateQuery.$lte) {
        query.reportDate = dateQuery;
      }
    }

    // 5. Fetch Data
    const total = await ReportOperational.countDocuments(query);

    const reports = await ReportOperational.find(query)
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