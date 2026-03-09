import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import PreArrival from "@/models/PreArrival";
import Vessel from "@/models/Vessel";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { getPreArrivalById } from "@/lib/services/preArrivalService";
import path from "path";
import { existsSync } from "fs";
import { unlink } from "fs/promises";
import { del } from "@vercel/blob";

// These are vessel library docs — never delete their physical files
const OFFICE_LIBRARY_DOCS = [
  "registry_cert", "tonnage_cert", "isps_ship", "isps_officer",
  "pi_cert", "sanitation_cert", "msm_cert", "hull_machinery",
  "safety_equipment", "medical_chest", "ships_particulars", "security_report"
];


export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await getPreArrivalById(id);

    if (!data) {
      return NextResponse.json({ error: "Pre-Arrival pack not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET Pre-Arrival Hydration Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Permission Check
    const authz = await authorizeRequest("prearrival.edit");
    
    // If authz.ok is false, we return. 
    // If it's true, TypeScript now knows 'session' MUST exist.
    if (!authz.ok || !authz.session) return authz.response;

    // Destructure session here to lock the type
    const { session } = authz;

    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    // 2. Duplicate RequestID Check
    if (body.requestId) {
      const existing = await PreArrival.findOne({ 
        requestId: body.requestId, 
        _id: { $ne: id } 
      });
      if (existing) {
        return NextResponse.json(
          { error: "Request ID already exists for another pack." },
          { status: 409 }
        );
      }
    }

    // 3. Perform Update
    const updated = await PreArrival.findByIdAndUpdate(
      id,
      {
        vesselId: body.vesselId,
        voyageId: body.voyageId,
        portName: body.portName,
        requestId: body.requestId,
        agentContact: body.agentContact,
        eta: body.eta,
        dueDate: body.dueDate,
        notes: body.notes,
    status: body.status,
        updatedBy: session.user.id, 
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Port Request not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });

  } catch (error: any) {
    console.error("UPDATE PRE-ARRIVAL ERROR →", error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A request with this ID already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update Port Request" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeRequest("prearrival.delete");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const { id } = await params;

    // 1. Fetch the record BEFORE deleting so we can access document URLs
    const preArrival = await PreArrival.findById(id).lean() as any;
    if (!preArrival) {
      return NextResponse.json(
        { error: "Port Request not found or already deleted" },
        { status: 404 }
      );
    }

    // 2. Delete physical files for non-library docs only
    const documents = preArrival.documents || {};
    const isLocal = process.env.UPLOAD_PROVIDER === "local";

    const fileDeletionPromises = Object.entries(documents).map(async ([docId, doc]: [string, any]) => {
      // ✅ Skip vessel library docs — their files belong to the vessel, not this pre-arrival
      if (OFFICE_LIBRARY_DOCS.includes(docId)) return;

      // Skip if no fileUrl (library doc reference only has vesselCertId)
      if (!doc?.fileUrl) return;

      try {
        if (isLocal) {
  let urlPath = doc.fileUrl;
  if (doc.fileUrl.startsWith("http")) {
    urlPath = new URL(doc.fileUrl).pathname;
  }
  const uploadsPrefix = "/uploads/";
  if (urlPath.startsWith(uploadsPrefix)) {
    const relativePath = urlPath.slice(uploadsPrefix.length);
    const filePath = path.join(process.cwd(), "public", "uploads", relativePath);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  }
}else {
          // Vercel Blob deletion
          await del(doc.fileUrl);
        }
      } catch (err) {
        // Log but don't block deletion if a file is already missing
        console.warn(`Could not delete file for doc [${docId}]:`, err);
      }
    });

    await Promise.all(fileDeletionPromises);

    // 3. Now delete the DB record
    await PreArrival.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Port Request and associated files permanently deleted"
    });

  } catch (error: any) {
    console.error("HARD DELETE PRE-ARRIVAL ERROR →", error);
    return NextResponse.json(
      { error: "Internal server error during deletion" },
      { status: 500 }
    );
  }
}