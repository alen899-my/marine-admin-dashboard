import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import ReportOperational from "@/models/ReportOperational";
import path from "path";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { put, del } from "@vercel/blob";
import { authorizeRequest } from "@/lib/authorizeRequest";
// --- HELPER: DELETE FILE ---
async function deleteFile(fileUrl: string) {
  if (!fileUrl) return;

  try {

    if (process.env.NODE_ENV === "development") {
    
      if (fileUrl.startsWith("/uploads")) {
        const filePath = path.join(process.cwd(), "public", fileUrl);
        if (existsSync(filePath)) {
          await unlink(filePath);
          console.log(`Deleted local file: ${filePath}`);
        }
      }
    } else {
 
      if (fileUrl.startsWith("http")) {
        await del(fileUrl);
        console.log(`Deleted blob file: ${fileUrl}`);
      }
    }
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}

// Define interface for update data allowing dynamic keys for dot notation
interface IUpdateNorData {
  [key: string]: string | Date | undefined;
}

// --- PATCH: UPDATE NOR ---
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
     const authz = await authorizeRequest("nor.edit");
        if (!authz.ok) return authz.response;
    await dbConnect();
    const { id } = await params;
    const formData = await req.formData();

    // 1. Fetch Existing
    const existingRecord = await ReportOperational.findById(id);
    if (!existingRecord) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // 2. Prepare Update Data
    // Fixed: Use typed interface instead of 'any'
    const updateData: IUpdateNorData = {};

    // Basic Fields
    const reportDate = formData.get("reportDate") as string;
    if (reportDate) updateData.reportDate = new Date(reportDate);

    const vesselName = formData.get("vesselName") as string;
    if (vesselName) updateData.vesselName = vesselName;

    const voyageId = formData.get("voyageNo") as string;
    if (voyageId) updateData.voyageId = voyageId;

    const portName = formData.get("portName") as string;
    if (portName) updateData.portName = portName;

    const remarks = formData.get("remarks") as string;
    if (remarks) updateData.remarks = remarks;

    const status = formData.get("status") as string;
    if (status) updateData.status = status;

    // Nested Fields
    const pilotStation = formData.get("pilotStation") as string;
    if (pilotStation) updateData["norDetails.pilotStation"] = pilotStation;

    const etaPort = formData.get("etaPort") as string;
    if (etaPort) updateData["norDetails.etaPort"] = new Date(etaPort);

    const norTenderTime = formData.get("norTenderTime") as string;
    if (norTenderTime) {
      updateData["norDetails.tenderTime"] = new Date(norTenderTime);
      updateData["eventTime"] = new Date(norTenderTime);
    }

    // 3. Handle File Update
    const file = formData.get("norDocument") as File | null;

    if (file && file.size > 0) {
      // 500 KB Validation
      if (file.size > 500 * 1024) {
        return NextResponse.json(
          { error: "File size exceeds the 500 KB limit." },
          { status: 400 }
        );
      }

      // A. Delete old file
      const oldUrl = existingRecord.norDetails?.documentUrl;
      if (oldUrl) {
        await deleteFile(oldUrl);
      }

      // B. Upload New File (Conditional)
      const filename = `${Date.now()}_${file.name.replace(/\s/g, "_")}`;

      if (process.env.NODE_ENV === "development") {
        // --- LOCAL STORAGE ---
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = path.join(process.cwd(), "public/uploads/nor");

        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        await writeFile(path.join(uploadDir, filename), buffer);
        updateData["norDetails.documentUrl"] = `/uploads/nor/${filename}`;
      } else {
        // --- VERCEL BLOB ---
        const blob = await put(filename, file, {
          access: "public",
          addRandomSuffix: true,
        });
        updateData["norDetails.documentUrl"] = blob.url;
      }
    }

    // 4. Perform Update
    const report = await ReportOperational.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({ report });
  } catch (error: unknown) {
    // Fixed: Use 'unknown' and safe type narrowing
    console.error("Update Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: "Update failed", details: errorMessage },
      { status: 500 }
    );
  }
}

// --- DELETE: REMOVE NOR ---
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
        const authz = await authorizeRequest("nor.delete");
        if (!authz.ok) return authz.response;
    await dbConnect();
    const { id } = await params;
    // 1. Find record
    const record = await ReportOperational.findById(id);
    if (!record) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // 2. Delete File (Conditional)
    const fileUrl = record.norDetails?.documentUrl;
    if (fileUrl) {
      await deleteFile(fileUrl);
    }

    // 3. Delete Record
    await ReportOperational.findByIdAndDelete(id);

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}