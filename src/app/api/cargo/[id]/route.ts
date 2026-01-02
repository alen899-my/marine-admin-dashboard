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
// --- HELPER: DELETE FILE ---
async function deleteFile(fileUrl: string) {
  if (!fileUrl) return;

  try {
    if (process.env.NODE_ENV === "development") {
      // --- LOCAL DELETE ---
      if (fileUrl.startsWith("/uploads")) {
        const filePath = path.join(process.cwd(), "public", fileUrl);
        if (existsSync(filePath)) {
          await unlink(filePath);
          console.log(`Deleted local file: ${filePath}`);
        }
      }
    } else {
      // --- BLOB DELETE ---
      if (fileUrl.startsWith("http")) {
        await del(fileUrl);
        console.log(`Deleted blob file: ${fileUrl}`);
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
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }
    const vesselId = formData.get("vesselId") as string;
    // Extract Text Fields
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
      documentDate: new Date(documentDate),
      status,
      remarks,
    };
    if (vesselId) {
      updateData.vesselId = vesselId;
    }

    // 🔥 CRITICAL: Re-resolve voyageId based on vessel + voyageNo
    if (vesselId && voyageNo) {
      const voyage = await Voyage.findOne({
        vesselId,
        voyageNo,
      });

      if (voyage) {
        updateData.voyageId = voyage._id;
      }
    }

    // If new file uploaded, process it
    if (file) {
      // 500 KB Validation Server Side
      if (file.size > 500 * 1024) {
        return NextResponse.json(
          { error: "File size exceeds the 500 KB limit." },
          { status: 400 }
        );
      }

      // A. Delete Old File
      if (existingDoc.file?.url) {
        await deleteFile(existingDoc.file.url);
      }

      // B. Upload New File
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
      const filename = `${timestamp}-${safeName}`;
      let fileUrl = "";

      if (process.env.NODE_ENV === "development") {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = path.join(process.cwd(), "public/uploads/cargo");

        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }
        await writeFile(path.join(uploadDir, filename), buffer);
        fileUrl = `/uploads/cargo/${filename}`;
      } else {
        const blob = await put(filename, file, {
          access: "public",
          addRandomSuffix: true,
        });
        fileUrl = blob.url;
      }

      updateData.file = {
        url: fileUrl,
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      };
    }

    const updatedDoc = await Document.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    return NextResponse.json({ message: "Updated", data: updatedDoc });
  } catch (error: unknown) {
    // Fixed: Use 'unknown' type and narrow safely
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

    // 1. Find document first
    const docToDelete = await Document.findById(id);

    if (!docToDelete) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // 2. Delete file (Local or Blob)
    if (docToDelete.file?.url) {
      await deleteFile(docToDelete.file.url);
    }

    // 3. Delete DB Record
    await Document.findByIdAndDelete(id);

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error: unknown) {
    // Fixed: Use 'unknown' type and narrow safely
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
