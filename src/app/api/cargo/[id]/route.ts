import { NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import { dbConnect } from "@/lib/db";
import Document from "@/models/Document";
import { put, del } from "@vercel/blob";
import { existsSync } from "fs";
import Voyage from "@/models/Voyage";
import { auth } from "@/auth"; 
import { authorizeRequest } from "@/lib/authorizeRequest";
import { handleUpload } from "@/lib/handleUpload";

// --- HELPER: PARSE DD/MM/YYYY or YYYY-MM-DD → Date ---
function parseDMY(str: string): Date {
  if (!str) throw new Error("Document date is required");
  if (str.includes("/")) {
    const [day, month, year] = str.split("/");
    return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
  }
  const d = new Date(str);
  if (isNaN(d.getTime())) throw new Error("Invalid document date");
  return d;
}
async function deleteFile(fileUrl: string) {
  if (!fileUrl) return;



  try {
    if (process.env.UPLOAD_PROVIDER === "local") {
      let urlPath = fileUrl;
      if (fileUrl.startsWith("http")) {
        urlPath = new URL(fileUrl).pathname;
      }

      console.log("urlPath:", urlPath);

      const uploadsPrefix = "/uploads/";
      if (urlPath.startsWith(uploadsPrefix)) {
        const relativePath = urlPath.slice(uploadsPrefix.length);
        const filePath = path.join(process.cwd(), "public", "uploads", relativePath);

      

        if (existsSync(filePath)) {
          await unlink(filePath);
          console.log("Deleted successfully");
        } else {
          console.warn("File not found at path:", filePath);
        }
      } else {
        console.warn("URL does not match expected prefix:", urlPath);
      }
    } else {
      if (fileUrl.startsWith("http")) {
        await del(fileUrl);
        console.log("Blob deleted");
      }
    }
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}
// Define interface for update data
interface IUpdateData {
  vesselName: string;
  voyageNo: string;
  portName: string;
  portType: string;
  vesselId?: string;
  voyageId?: string;
  reportDate?: Date;
  documentType: string;
  documentDate: Date;
  status: string;
  updatedBy?: any;
  remarks: string;
  file?: {
    url: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  };
}

// --- PATCH: Update Record (Multipart/Form-Data) ---
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    const authz = await authorizeRequest("cargo.edit");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const { id } = await params;
    const formData = await req.formData();

    // 1. Fetch Existing Record
    const existingDoc = await Document.findById(id);
    if (!existingDoc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // 2. Extract Text Fields
    const vesselId = formData.get("vesselId") as string;
    const reportDate = formData.get("reportDate") as string;
    const vesselName = formData.get("vesselName") as string;
    const voyageNo = formData.get("voyageNo") as string;
    const portName = formData.get("portName") as string;
    const portType = formData.get("portType") as string;
    const documentType = formData.get("documentType") as string;
    const documentDate = formData.get("documentDate") as string;
    const status = formData.get("status") as string;
    const remarks = formData.get("remarks") as string;
    const file = formData.get("file") as File | null;

    const updateData: IUpdateData = {
      vesselName,
      voyageNo,
      portName,
      updatedBy: currentUserId,
      portType,
      reportDate: reportDate ? new Date(reportDate) : undefined,
      documentType,
      documentDate: parseDMY(documentDate),
      status,
      remarks,
    };

    if (vesselId) {
      updateData.vesselId = vesselId;
    }

    // Re-resolve voyageId based on vessel + voyageNo
    if (vesselId && voyageNo) {
      const voyage = await Voyage.findOne({ vesselId, voyageNo });
      if (voyage) {
        updateData.voyageId = voyage._id;
      }
    }

    // ── File Update ────────────────────────────────────────────────────────
    if (file && file.size > 0) {
      if (file.size > 500 * 1024) {
        return NextResponse.json(
          { error: "File size exceeds the 500 KB limit." },
          { status: 400 }
        );
      }

      // Delete old file first (never throws — safe even if file is missing)
      if (existingDoc.file?.url) {
        await deleteFile(existingDoc.file.url);
      }

      // Upload new file
      try {
        const uploaded = await handleUpload(file, "cargo");
        updateData.file = {
          url: uploaded.url,
          originalName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        };
      } catch (err) {
        console.error("Cargo document upload failed:", err);
        return NextResponse.json(
          { error: "Failed to upload document." },
          { status: 500 }
        );
      }
    }

    // 3. Perform Update
    const updatedDoc = await Document.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    return NextResponse.json({ message: "Updated", data: updatedDoc });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
// --- DELETE: Remove Record ---
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeRequest("cargo.delete");
    if (!authz.ok) return authz.response;
    await dbConnect();
    const { id } = await params;

    // 1. Find and Delete the document from the database
    // We use findByIdAndDelete to remove the record permanently.
    const docToDelete = await Document.findByIdAndDelete(id);

    if (!docToDelete) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // 2. Perform Physical File Cleanup
    // Since this is a hard delete, we now call the deletion logic for the actual file
    // to prevent storage clutter, as the record no longer exists in the DB.
    if (docToDelete.file?.url) {
      await deleteFile(docToDelete.file.url);
    }

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error: unknown) {
    // Narrow safely
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
