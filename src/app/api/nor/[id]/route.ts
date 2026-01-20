import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import ReportOperational from "@/models/ReportOperational";
import Voyage from "@/models/Voyage"; // ✅ Import Voyage
import mongoose from "mongoose"; 
import path from "path";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { put, del } from "@vercel/blob";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { auth } from "@/auth";
// --- HELPER: DELETE FILE ---
async function deleteFile(fileUrl: string) {
  if (!fileUrl) return;
  try {
    if (process.env.NODE_ENV === "development") {
      if (fileUrl.startsWith("/uploads")) {
        const filePath = path.join(process.cwd(), "public", fileUrl);
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth(); // ✅ Get session
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

    // --- B. VOYAGE & VESSEL LOOKUP LOGIC ---
    const voyageNoString = formData.get("voyageNo") as string;
    const formVesselId = formData.get("vesselId") as string;

    // 🔴 FIX: Explicitly update vesselId if provided in form
    if (formVesselId) {
      updateData.vesselId = new mongoose.Types.ObjectId(formVesselId);
    }

    // Use form vesselId if available, otherwise fallback to existing record's ID for the lookup
    const lookupVesselId = formVesselId || existingRecord.vesselId?.toString();

    if (voyageNoString && lookupVesselId) {
       // 1. Update the Snapshot String
       updateData.voyageNo = voyageNoString;

       // 2. Find and Link the real Voyage ObjectId
       const foundVoyage = await Voyage.findOne({
          vesselId: new mongoose.Types.ObjectId(lookupVesselId),
          voyageNo: { $regex: new RegExp(`^${voyageNoString}$`, "i") }
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

    // Nested Fields (Dot Notation for Mongoose)
    const pilotStation = formData.get("pilotStation") as string;
    if (pilotStation) updateData["norDetails.pilotStation"] = pilotStation;

    const etaPort = formData.get("etaPort") as string;
    if (etaPort) updateData["norDetails.etaPort"] = new Date(etaPort);

    const norTenderTime = formData.get("norTenderTime") as string;
    if (norTenderTime) {
      updateData["norDetails.tenderTime"] = new Date(norTenderTime);
      updateData["eventTime"] = new Date(norTenderTime); // Sync eventTime
    }

    // 3. Handle File Update
    const file = formData.get("norDocument") as File | null;

    if (file && file.size > 0) {
      if (file.size > 500 * 1024) {
        return NextResponse.json({ error: "File size exceeds the 500 KB limit." }, { status: 400 });
      }

      // Delete old file
      const oldUrl = existingRecord.norDetails?.documentUrl;
      if (oldUrl) await deleteFile(oldUrl);

      // Upload New File
      const filename = `${Date.now()}_${file.name.replace(/\s/g, "_")}`;

      if (process.env.NODE_ENV === "development") {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = path.join(process.cwd(), "public/uploads/nor");
        if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);
        updateData["norDetails.documentUrl"] = `/uploads/nor/${filename}`;
      } else {
        const blob = await put(filename, file, { access: "public", addRandomSuffix: true });
        updateData["norDetails.documentUrl"] = blob.url;
      }
    }

    // 4. Perform Update
    const report = await ReportOperational.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
    // ✅ POPULATE VOYAGE ID (Crucial for frontend display)
    .populate("voyageId", "voyageNo")
    .populate({
  path: "vesselId",
  select: "name company", // Include name and company reference
  populate: {
    path: "company",      // Populate the company document
    select: "name",       // Only fetch the company name
  },
})
    .populate("createdBy", "fullName") 
.populate("updatedBy", "fullName"); // 

    return NextResponse.json({ report });
  } catch (error: unknown) {
    console.error("Update Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: "Update failed", details: errorMessage }, { status: 500 });
  }
}

// --- DELETE: REMOVE NOR (Unchanged) ---
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeRequest("nor.delete");
    if (!authz.ok) return authz.response;
    
    await dbConnect();
    const { id } = await params;
    
    const record = await ReportOperational.findById(id);
    if (!record) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // SOFT DELETE LOGIC
    // We update the record instead of deleting it.
    // NOTE: We do NOT delete the file (fileUrl) so that the soft-deleted
    // record remains complete for historical/audit purposes.
    await ReportOperational.findByIdAndUpdate(
      id,
      {
        $set: {
          deletedAt: new Date(),
          status: "inactive",
        },
      },
      { new: true }
    );

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}