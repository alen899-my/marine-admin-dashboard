import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import PreArrival from "@/models/PreArrival";
import Vessel from "@/models/Vessel"; // ✅ Registered to enable .populate()
import { authorizeRequest } from "@/lib/authorizeRequest";
import { getPreArrivalById } from "@/lib/services/preArrivalService";
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
    // 1. Permission Check
    const authz = await authorizeRequest("prearrival.delete");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const { id } = await params;

    // 2. Hard Delete - Permanently removes from collection
    const deletedPack = await PreArrival.findByIdAndDelete(id);

    if (!deletedPack) {
      return NextResponse.json(
        { error: "Port Request not found or already deleted" }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Port Request permanently deleted" 
    });

  } catch (error: any) {
    console.error("HARD DELETE PRE-ARRIVAL ERROR →", error);
    return NextResponse.json(
      { error: "Internal server error during deletion" },
      { status: 500 }
    );
  }
}