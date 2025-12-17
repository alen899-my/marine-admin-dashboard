// src/app/api/cargo/route.ts
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { dbConnect } from "@/lib/db";
import Document from "@/models/Document"; // Adjust path to your model
import { put } from "@vercel/blob";
import { existsSync } from "fs";

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

    // Parse FormData
    const formData = await req.formData();

    // Extract fields
    const vesselName = formData.get("vesselName") as string;
    const voyageNo = formData.get("voyageNo") as string;
    const portName = formData.get("portName") as string;
    const portType = formData.get("portType") as string;
    const reportDate = formData.get("reportDate") as string;
    const documentType = formData.get("documentType") as string;
    const documentDate = formData.get("documentDate") as string;
    const remarks = formData.get("remarks") as string;
    const file = formData.get("file") as File | null;

    // Basic Validation
    if (
      !vesselName ||
      !voyageNo ||
      !portName ||
      !portType ||
      !documentType ||
      !documentDate ||
      !file
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // --- File Validation (Max 500KB) ---
    if (file.size > 500 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds the 500 KB limit." },
        { status: 400 }
      );
    }

    // --- File Handling Start ---
    let fileUrl = "";
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
    const filename = `${timestamp}-${safeName}`;

    // Conditional Logic: Dev (Local) vs Prod (Blob)
    if (process.env.NODE_ENV === "development") {
      const buffer = Buffer.from(await file.arrayBuffer());

      // Define Upload Path: ./public/uploads/cargo
      const uploadDir = path.join(process.cwd(), "public/uploads/cargo");

      // Ensure directory exists
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);

      // Write file to disk
      await writeFile(filePath, buffer);

      // Public URL (Relative path for frontend)
      fileUrl = `/uploads/cargo/${filename}`;
    } else {
      // --- VERCEL BLOB UPLOAD ---
      const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: true,
      });
      fileUrl = blob.url;
    }
    // --- File Handling End ---

    // ✅ PARSE REPORT DATE
    let finalReportDate = new Date(); // Default to now
    if (reportDate) {
       const parsed = parseDateString(reportDate);
       if (!parsed) {
         return NextResponse.json(
           { error: "Invalid Report Date Format. Please use dd/mm/yyyy" }, 
           { status: 400 }
         );
       }
       finalReportDate = parsed;
    }

    // ✅ PARSE DOCUMENT DATE (Fixed this section)
    let finalDocumentDate = new Date();
    if (documentDate) {
      const parsed = parseDateString(documentDate);
      if (!parsed) {
        return NextResponse.json(
          { error: "Invalid Document Date Format. Please use dd/mm/yyyy" },
          { status: 400 }
        );
      }
      finalDocumentDate = parsed;
    }

    // Save to Database
    const newDoc = await Document.create({
      vesselName,
      voyageNo,
      portName,
      portType,
      documentType,
      
      reportDate: finalReportDate,
      documentDate: finalDocumentDate, // ✅ Using the parsed date variable
      
      remarks,
      file: {
        url: fileUrl,
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      },
      status: "active", // Default status
    });

    return NextResponse.json(
      { message: "File uploaded successfully", data: newDoc },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Upload Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

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

    // 2. Build Query
    const query: Record<string, unknown> = {};

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
    const data = await Document.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Document.countDocuments(query);

    return NextResponse.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}