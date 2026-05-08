import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import PreArrival from "@/models/PreArrival";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { handleUpload } from "@/lib/handleUpload";
import { buildCompanyUploadFolder, sanitizeFolderSegment } from "@/lib/uploadFolders";

type UploadItem = {
  docId: string;
  docName: string;
  owner: string;
  note: string;
  file: File | null;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseUploadItems(formData: FormData): UploadItem[] {
  const bulkMetaRaw = formData.get("items");

  if (typeof bulkMetaRaw === "string" && bulkMetaRaw.trim()) {
    const parsedItems = JSON.parse(bulkMetaRaw) as Array<{
      docId?: string;
      name?: string;
      owner?: string;
      note?: string;
      fileKey?: string;
    }>;

    return parsedItems
      .filter((item) => item.docId)
      .map((item) => {
        const fileValue = item.fileKey ? formData.get(item.fileKey) : null;
        return {
          docId: item.docId || "",
          docName: item.name || "",
          owner: item.owner || "",
          note: item.note || "",
          file: fileValue instanceof File && fileValue.size > 0 ? fileValue : null,
        };
      });
  }

  const fileValue = formData.get("file");
  return [
    {
      docId: readString(formData, "docId"),
      docName: readString(formData, "name"),
      owner: readString(formData, "owner"),
      note: readString(formData, "note"),
      file: fileValue instanceof File && fileValue.size > 0 ? fileValue : null,
    },
  ].filter((item) => item.docId);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeRequest("prearrival.upload");
    if (!authz.ok || !authz.session) {
      return authz.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = authz.session.user.id;

    const formData = await req.formData();
    const uploadItems = parseUploadItems(formData);

    console.log("[UPLOAD] Received upload request:", {
      count: uploadItems.length,
      files: uploadItems.filter((item) => item.file).length,
    });

    if (uploadItems.length === 0) {
      return NextResponse.json({ error: "No documents supplied" }, { status: 400 });
    }

    await dbConnect();

    const preArrival = await PreArrival.findById(id)
      .select("documents requestId vesselId isLocked status")
      .populate({
        path: "vesselId",
        select: "company",
        populate: {
          path: "company",
          select: "name",
        },
      })
      .lean({ flattenMaps: true }) as any;
    if (!preArrival) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const isPackLocked =
      !!preArrival.isLocked ||
      ["sent", "acknowledged", "completed"].includes(preArrival.status);

    if (isPackLocked) {
      return NextResponse.json(
        { error: `This pre-arrival pack is locked in ${preArrival.status || "its current"} status.` },
        { status: 423 }
      );
    }
    

    const requestFolder = sanitizeFolderSegment(preArrival.requestId || id, "request");
    const folder = buildCompanyUploadFolder({
      companyName: preArrival.vesselId?.company?.name || authz.session.user.company?.name,
      module: "prearrival",
      subfolder: requestFolder,
    });

    const uploadedByDocId = new Map<string, { url: string; name: string; size: number; originalName: string }>();
    for (const item of uploadItems) {
      if (!item.file) continue;
      const file = item.file as File;
      console.log("[UPLOAD] Calling handleUpload for file:", file.name, "folder:", folder);
      const uploaded = await handleUpload(file, folder);
      uploadedByDocId.set(item.docId, {
        url: uploaded.url,
        name: uploaded.name,
        size: file.size,
        originalName: file.name,
      });
    }

    const updateData: any = { updatedBy: userId };
    const pushData: any = {};

    for (const item of uploadItems) {
      const existingDocument = preArrival.documents?.[item.docId] || {};
      const effectiveOwner = item.owner || existingDocument.owner || "ship";
      const historyRole = effectiveOwner === "office" ? "admin" : "ship";
      const uploaded = uploadedByDocId.get(item.docId);

      updateData[`documents.${item.docId}.docSource`] =
        effectiveOwner === "office" ? "office_upload" : "onboard_upload";
      if (item.docName) updateData[`documents.${item.docId}.name`] = item.docName;
      if (item.owner) updateData[`documents.${item.docId}.owner`] = item.owner;
      updateData[`documents.${item.docId}.note`] = item.note || "";

      if (uploaded) {
        updateData[`documents.${item.docId}.fileName`] = uploaded.name;
        updateData[`documents.${item.docId}.fileUrl`] = uploaded.url;
        updateData[`documents.${item.docId}.fileSize`] = uploaded.size;
        updateData[`documents.${item.docId}.status`] =
          effectiveOwner === "office" ? "approved" : "pending_review";
        updateData[`documents.${item.docId}.rejectionReason`] = "";
        updateData[`documents.${item.docId}.uploadedBy`] = userId;
        updateData[`documents.${item.docId}.uploadedAt`] = new Date();

        pushData[`documents.${item.docId}.rejectionHistory`] = {
          message: `File uploaded: ${uploaded.originalName}`,
          role: historyRole,
          createdAt: new Date(),
        };
      } else if (item.note) {
        pushData[`documents.${item.docId}.rejectionHistory`] = {
          message: item.note,
          role: historyRole,
          createdAt: new Date(),
        };
      }
    }

    const updatedRequest = await PreArrival.findByIdAndUpdate(
      id,
      {
        $set: updateData,
        ...(Object.keys(pushData).length > 0 ? { $push: pushData } : {}),
      },
      { new: true, lean: true }
    );

    const updatedDocuments = updatedRequest.documents as any;
    const firstDocId = uploadItems[0].docId;

    return NextResponse.json({
      success: true,
      document: updatedDocuments[firstDocId],
      documents: uploadItems.reduce((acc: Record<string, any>, item) => {
        acc[item.docId] = updatedDocuments[item.docId];
        return acc;
      }, {}),
    });

  } catch (error: any) {
    console.error("PATCH Document Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
