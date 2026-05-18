import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import PreArrival from "@/models/PreArrival";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { getPreArrivalById } from "@/lib/services/preArrivalService";
import path from "path";
import { existsSync } from "fs";
import { unlink } from "fs/promises";
import { del } from "@vercel/blob";


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
    const authz = await authorizeRequest("prearrival.edit");
    if (!authz.ok || !authz.session) return authz.response;
    const { session } = authz;

    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const current = await PreArrival.findById(id)
      .select("status submittedAt")
      .lean() as any;
    if (!current) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Duplicate request ID check
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

    // Build update fields
    const updateFields: any = {
      vesselId:     body.vesselId,
      voyageId:     body.voyageId,
      portName:     body.portName,
      requestId:    body.requestId,
      agentContact: body.agentContact,
      eta:          body.eta,
      dueDate:      body.dueDate,
      notes:        body.notes,
      status:       body.status,
      updatedBy:    session.user.id,
    };

    updateFields.isLocked = body.status === "completed";

    if (body.status === "sent" && !current.submittedAt) {
      updateFields.submittedAt = new Date();
      updateFields.submittedBy = session.user.id;
    }

    if (body.status === "acknowledged") {
      updateFields.acknowledgedAt = new Date();
    }

    const updated = await PreArrival.findByIdAndUpdate(
      id,
      { $set: updateFields },
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

    // 2. Delete physical files
    const documents = preArrival.documents || {};
    const isLocal = process.env.UPLOAD_PROVIDER === "local";

    const fileDeletionPromises = Object.entries(documents).map(async ([docId, doc]: [string, any]) => {
      // Skip if no fileUrl
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
