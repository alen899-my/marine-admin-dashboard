import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import PreArrival from "@/models/PreArrival";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { del } from "@vercel/blob";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { handleUpload } from "@/lib/handleUpload";
import { buildCompanyUploadFolder, sanitizeFolderSegment } from "@/lib/uploadFolders";

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
    const file = formData.get("file") as File | null;
    const docId = formData.get("docId") as string;
    const docName = formData.get("name") as string;
    const owner = formData.get("owner") as string;
    const note = formData.get("note") as string;

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
    

    const updateData: any = {};
    const pushData: any = {};
    const existingDocument = preArrival.documents?.[docId] || {};
    const effectiveOwner = owner || existingDocument.owner || "ship";
    const historyRole = effectiveOwner === "office" ? "admin" : "ship";

    if (file && file.size > 0) {
      const requestFolder = sanitizeFolderSegment(preArrival.requestId || id, "request");
      const folder = buildCompanyUploadFolder({
        companyName: preArrival.vesselId?.company?.name || authz.session.user.company?.name,
        module: "prearrival",
        subfolder: requestFolder,
      });

      const oldFileUrl = preArrival.documents?.[docId]?.fileUrl;
      if (oldFileUrl) {
        try {
          if (process.env.UPLOAD_PROVIDER === "local") {
            const urlPath = oldFileUrl.startsWith("http") ? new URL(oldFileUrl).pathname : oldFileUrl;
            const uploadsPrefix = "/uploads/";
            if (urlPath.startsWith(uploadsPrefix)) {
              const filePath = path.join(process.cwd(), "public", "uploads", urlPath.slice(uploadsPrefix.length));
              if (existsSync(filePath)) await unlink(filePath);
            }
          } else {
            await del(oldFileUrl);
          }
        } catch (err) {
          console.warn("Could not delete old file:", err);
        }
      }

      const uploaded = await handleUpload(file, folder);
      updateData[`documents.${docId}.fileName`] = uploaded.name;
      updateData[`documents.${docId}.fileUrl`] = uploaded.url;
      updateData[`documents.${docId}.fileSize`] = file.size;
      updateData[`documents.${docId}.status`] =
        effectiveOwner === "office" ? "approved" : "pending_review";
      updateData[`documents.${docId}.rejectionReason`] = "";
      updateData[`documents.${docId}.uploadedBy`] = userId;
      updateData[`documents.${docId}.uploadedAt`] = new Date();

      pushData[`documents.${docId}.rejectionHistory`] = {
        message: `File uploaded: ${file.name}`,
        role: historyRole,
        createdAt: new Date(),
      };
    }

    updateData[`documents.${docId}.docSource`] = effectiveOwner === "office" ? "office_upload" : "onboard_upload";
    if (docName) updateData[`documents.${docId}.name`] = docName;
    if (owner) updateData[`documents.${docId}.owner`] = owner;
    updateData[`documents.${docId}.note`] = note || "";

    if (note && !file) {
      pushData[`documents.${docId}.rejectionHistory`] = {
        message: note,
        role: historyRole,
        createdAt: new Date(),
      };
    }
    updateData[`updatedBy`] = userId;

    const updatedRequest = await PreArrival.findByIdAndUpdate(
      id,
      {
        $set: updateData,
        ...(Object.keys(pushData).length > 0 ? { $push: pushData } : {}),
      },
      { new: true, lean: true }
    );

    const responseDoc = (updatedRequest.documents as any)[docId];

    return NextResponse.json({
      success: true,
      document: responseDoc,
    });

  } catch (error: any) {
    console.error("PATCH Document Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
