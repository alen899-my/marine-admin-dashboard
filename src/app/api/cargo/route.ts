
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Document from "@/models/Document"; 
import { put } from "@vercel/blob";
import { existsSync } from "fs";
import { authorizeRequest } from "@/lib/authorizeRequest";
import Voyage from "@/models/Voyage";
import mongoose from "mongoose";
import Vessel from "@/models/Vessel";

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
    const session = await auth();
    const currentUserId = session?.user?.id;
    const authz = await authorizeRequest("cargo.create");
    if (!authz.ok) return authz.response;
    await dbConnect();

    const formData = await req.formData();

    // Extract fields
    const vesselIdString = formData.get("vesselId") as string;
    const voyageNoString = formData.get("voyageNo") as string;

    // We don't need vesselName string anymore

    const portName = formData.get("portName") as string;
    const portType = formData.get("portType") as string;
    const reportDate = formData.get("reportDate") as string;
    const documentType = formData.get("documentType") as string;
    const documentDate = formData.get("documentDate") as string;
    const remarks = formData.get("remarks") as string;
    const file = formData.get("file") as File | null;

    if (!file)
      return NextResponse.json({ error: "File required" }, { status: 400 });
    if (file.size > 500 * 1024)
      return NextResponse.json({ error: "File size > 500KB" }, { status: 400 });

    // --- File Handling ---
    let fileUrl = "";
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
    const filename = `${timestamp}-${safeName}`;

    if (process.env.NODE_ENV === "development") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadDir = path.join(process.cwd(), "public/uploads/cargo");
      if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);
      fileUrl = `/uploads/cargo/${filename}`;
    } else {
      const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: true,
      });
      fileUrl = blob.url;
    }

    // Dates
    let finalReportDate = parseDateString(reportDate) || new Date();
    let finalDocumentDate = parseDateString(documentDate) || new Date();

    // ==========================================
    // ✅ VOYAGE ID LOOKUP LOGIC
    // ==========================================
    let voyageObjectId = null;

    if (vesselIdString && voyageNoString) {
      const vId = new mongoose.Types.ObjectId(vesselIdString);

      const foundVoyage = await Voyage.findOne({
        vesselId: vId,
        voyageNo: { $regex: new RegExp(`^${voyageNoString}$`, "i") },
      }).select("_id");

      if (foundVoyage) {
        voyageObjectId = foundVoyage._id;
      } else {
        return NextResponse.json(
          { error: `Voyage ${voyageNoString} not found.` },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Missing Vessel ID or Voyage Number" },
        { status: 400 }
      );
    }

    // Save to Database
    const newDoc = await Document.create({
      // ✅ Save Mapped IDs Only (No Strings)
      vesselId: new mongoose.Types.ObjectId(vesselIdString),
      voyageId: voyageObjectId,
      createdBy: currentUserId,
      updatedBy: currentUserId,
      portName,
      portType,
      documentType,
      reportDate: finalReportDate,
      documentDate: finalDocumentDate,
      remarks,
      file: {
        url: fileUrl,
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      },
      status: "active",
    });

    return NextResponse.json(
      { message: "Uploaded successfully", data: newDoc },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: error.message || "Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const authz = await authorizeRequest("cargo.view");
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

    const query: any = {};

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
          // If trying to access unauthorized vessel, return empty data
          return NextResponse.json({
            data: [],
            pagination: { total: 0, page, limit, totalPages: 0 },
          });
        }
      }
    } else {
      // Super Admin: Use selectedVessel filter directly if provided
      if (selectedVessel) query.vesselId = selectedVessel;
    }
    // =========================================================

    if (status !== "all") query.status = status;

    // Search logic
    if (search) {
      query.$or = [
        { portName: { $regex: search, $options: "i" } },
        { "file.originalName": { $regex: search, $options: "i" } }, // Also search filename
      ];
    }

    if (selectedVoyage) {
      query.voyageId = selectedVoyage;
    }

    if (startDate || endDate) {
      const dateQuery: any = {};
      if (startDate) dateQuery.$gte = parseDateString(startDate);
      if (endDate) {
        const end = parseDateString(endDate);
        if (end) {
          end.setHours(23, 59, 59, 999);
          dateQuery.$lte = end;
        }
      }
      if (dateQuery.$gte || dateQuery.$lte) query.reportDate = dateQuery;
    }

    const data = await Document.find(query)
      .populate("vesselId", "name")
      .populate("voyageId", "voyageNo")
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName")
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
  } catch (error: any) {
    console.error("GET DOCUMENTS ERROR →", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
