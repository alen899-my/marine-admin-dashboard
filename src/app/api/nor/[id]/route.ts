import { auth } from "@/auth";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import ReportOperational from "@/models/ReportOperational";
import Voyage from "@/models/Voyage"; //  Import Voyage
import { del, put } from "@vercel/blob";
import { existsSync } from "fs";
import { mkdir, unlink, writeFile } from "fs/promises";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import path from "path";
import { handleUpload } from "@/lib/handleUpload";

async function deleteFile(fileUrl: string) {
  if (!fileUrl) return;

  try {
    if (process.env.UPLOAD_PROVIDER === "local") {
      let urlPath = fileUrl;
      if (fileUrl.startsWith("http")) {
        urlPath = new URL(fileUrl).pathname;
      }

      const uploadsPrefix = "/uploads/";
      if (urlPath.startsWith(uploadsPrefix)) {
        const relativePath = urlPath.slice(uploadsPrefix.length);
        const filePath = path.join(process.cwd(), "public", "uploads", relativePath);
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      }
    } else {
      if (fileUrl.startsWith("http")) {
        await del(fileUrl);
      }
    }
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}

// Interface for dynamic update object
interface IUpdateNorData {
  [key: string]: string | Date | undefined | mongoose.Types.ObjectId;
}

// --- PATCH: UPDATE NOR ---
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const authz = await authorizeRequest("nor.edit");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const { id } = await params;
    const formData = await req.formData();

    // 1. Fetch Existing Record
    const existingRecord = await ReportOperational.findById(id);
    if (!existingRecord) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // 2. Prepare Update Data
    const updateData: IUpdateNorData = {
      updatedBy: currentUserId as any,
    };

    // --- A. Basic Fields ---
    const reportDate = formData.get("reportDate") as string;
    if (reportDate) updateData.reportDate = new Date(reportDate);

    const vesselName = formData.get("vesselName") as string;
    if (vesselName) updateData.vesselName = vesselName;

    // --- B. Voyage & Vessel Lookup ---
    const voyageNoString = formData.get("voyageNo") as string;
    const formVesselId = formData.get("vesselId") as string;

    if (formVesselId) {
      updateData.vesselId = new mongoose.Types.ObjectId(formVesselId);
    }

    const lookupVesselId = formVesselId || existingRecord.vesselId?.toString();

    if (voyageNoString && lookupVesselId) {
      updateData.voyageNo = voyageNoString;

      const foundVoyage = await Voyage.findOne({
        vesselId: new mongoose.Types.ObjectId(lookupVesselId),
        voyageNo: { $regex: new RegExp(`^${voyageNoString}$`, "i") },
      }).select("_id");

      if (foundVoyage) {
        updateData.voyageId = foundVoyage._id;
      }
    }

    // --- C. Other Fields ---
    const portName = formData.get("portName") as string;
    if (portName) updateData.portName = portName;

    const remarks = formData.get("remarks") as string;
    if (remarks) updateData.remarks = remarks;

    const status = formData.get("status") as string;
    if (status) updateData.status = status;

    const pilotStation = formData.get("pilotStation") as string;
    if (pilotStation) updateData["norDetails.pilotStation"] = pilotStation;

    const etaPort = formData.get("etaPort") as string;
    if (etaPort) updateData["norDetails.etaPort"] = new Date(etaPort);

    const norTenderTime = formData.get("norTenderTime") as string;
    if (norTenderTime) {
      updateData["norDetails.tenderTime"] = new Date(norTenderTime);
      updateData["eventTime"] = new Date(norTenderTime);
    }

    
    const file = formData.get("norDocument") as File | null;

    if (file && file.size > 0) {
      if (file.size > 500 * 1024) {
        return NextResponse.json(
          { error: "File size exceeds the 500 KB limit." },
          { status: 400 }
        );
      }

      // Delete old file first (never throws — safe even if file is missing)
      const oldUrl = existingRecord.norDetails?.documentUrl;
      if (oldUrl) await deleteFile(oldUrl);

      // Upload new file
      try {
        const uploaded = await handleUpload(file, "nor");
        updateData["norDetails.documentUrl"] = uploaded.url;
      } catch (err) {
        console.error("NOR document upload failed:", err);
        return NextResponse.json(
          { error: "Failed to upload NOR document." },
          { status: 500 }
        );
      }
    }

    // 3. Perform Update
    const report = await ReportOperational.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    )
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
      .populate("updatedBy", "fullName");

    return NextResponse.json({ report });
  } catch (error: unknown) {
    console.error("Update Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: "Update failed", details: errorMessage },
      { status: 500 },
    );
  }
}

// --- DELETE: REMOVE NOR ---
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authz = await authorizeRequest("nor.delete");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const { id } = await params;

    const deletedRecord = await ReportOperational.findByIdAndDelete(id);

    if (!deletedRecord) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Delete associated file
    const fileUrl = deletedRecord.norDetails?.documentUrl;
    if (fileUrl) {
      await deleteFile(fileUrl);
    }

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}