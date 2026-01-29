import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import PreArrival from "@/models/PreArrival";
import { authorizeRequest } from "@/lib/authorizeRequest";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authorization Check
    const authz = await authorizeRequest("prearrival.verify");
    
    // Narrowing types for TypeScript and returning unauthorized response if check fails
    if (!authz.ok || !authz.session) {
      return authz.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { session } = authz;
    const { id } = await params;
    const body = await req.json();
    
    // We expect 'reason' from the Rejection Modal
    const { docId, status, reason } = body;

    // 2. Input Validation
    if (!docId || !["approved", "rejected", "pending_review"].includes(status)) {
      return NextResponse.json({ error: "Invalid document ID or status" }, { status: 400 });
    }

    await dbConnect();

    // 3. Build atomic update object for the Document Map
    // We use dot notation to update only specific sub-fields
    const setData: any = {
      [`documents.${docId}.status`]: status,
      [`documents.${docId}.updatedAt`]: new Date(),
      updatedBy: session.user.id,
    };
    const pushData: any = {};

    if (status === "rejected") {
      const message = reason || "No reason provided";
      setData[`documents.${docId}.rejectionReason`] = message; // Keep existing field
      
      // ✅ Add to History
      pushData[`documents.${docId}.rejectionHistory`] = {
        message: message,
        role: "admin", // Verification is done by Admin
        createdAt: new Date(),
      };
    } else if (status === "approved") {
      setData[`documents.${docId}.rejectionReason`] = "";
      
      // Optional: Log approval in history too
      pushData[`documents.${docId}.rejectionHistory`] = {
        message: "Document approved",
        role: "admin",
        createdAt: new Date(),
      };
    }

    // 4. Database Update
   const updatedRequest = await PreArrival.findByIdAndUpdate(
      id,
      { 
        $set: setData,
        ...(Object.keys(pushData).length > 0 ? { $push: pushData } : {}) 
      },
      { new: true, runValidators: true }
    ).lean();
    if (!updatedRequest) {
      return NextResponse.json({ error: "Pre-Arrival request not found" }, { status: 404 });
    }

    // 5. Success Response
    // In lean(), documents is a plain object, so we access via key
    const updatedDoc = (updatedRequest.documents as any)?.[docId];

    return NextResponse.json({
      success: true,
      message: `Document ${status} successfully`,
      document: updatedDoc
    });

  } catch (error: any) {
    console.error("VERIFICATION_ROUTE_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}