import { dbConnect } from "@/lib/db";
import { authorizeRequest } from "@/lib/authorizeRequest";
import Voyage from "@/models/Voyage";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

/* ======================================
   UPDATE VOYAGE (PATCH)
====================================== */
/* ======================================
   UPDATE VOYAGE (PATCH)
====================================== */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authorization
    const authz = await authorizeRequest("voyage.edit");
    if (!authz.ok) return authz.response;

    // 2. Authentication
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentUserId = session.user.id;

    await dbConnect();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid voyage ID" }, { status: 400 });
    }

    const body = await req.json();

    // 3. Fetch Existing Voyage
    const currentVoyage = await Voyage.findById(id);
    if (!currentVoyage) {
      return NextResponse.json({ error: "Voyage not found" }, { status: 404 });
    }

    // ---------------------------------------------------------
    // 4. SMART DUPLICATE CHECK (Handles Vessel Change OR Number Change)
    // ---------------------------------------------------------
    
    // Determine what the "New" state will look like
    const targetVesselId = body.vesselId || currentVoyage.vesselId.toString();
    const targetVoyageNo = body.voyageNo || currentVoyage.voyageNo;

    // Check if anything significant changed
    const isVesselChanged = body.vesselId && body.vesselId !== currentVoyage.vesselId.toString();
    const isNoChanged = body.voyageNo && body.voyageNo !== currentVoyage.voyageNo;

    if (isVesselChanged || isNoChanged) {
      const duplicate = await Voyage.findOne({
        vesselId: targetVesselId, // Check against the NEW vessel ID
        voyageNo: targetVoyageNo,
        _id: { $ne: id }, // Exclude current doc
      });

      if (duplicate) {
        return NextResponse.json(
          { error: `Voyage ${targetVoyageNo} already exists for the selected vessel.` },
          { status: 409 }
        );
      }
    }

    // ---------------------------------------------------------
    // 5. Construct Update Data (NOW INCLUDING VESSELID)
    // ---------------------------------------------------------
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      voyageNo: body.voyageNo,
      status: body.status,
      updatedBy: currentUserId,
    };

    // ✅ FIX: Add vesselId if it exists in body
    if (body.vesselId) {
      updateData.vesselId = body.vesselId;
    }

    // Handle Nested Objects
    if (body.route) {
      updateData.route = {
        loadPort: body.route.loadPort,
        dischargePort: body.route.dischargePort,
        via: body.route.via,
        totalDistance: body.route.totalDistance,
      };
    }

    if (body.schedule) {
      updateData.schedule = {
        startDate: body.schedule.startDate,
        eta: body.schedule.eta,
        endDate: body.schedule.endDate,
      };
    }

    if (body.cargo) {
      updateData.cargo = {
        commodity: body.cargo.commodity,
        quantity: body.cargo.quantity,
        grade: body.cargo.grade,
      };
    }

    if (body.charter) {
      updateData.charter = {
        chartererName: body.charter.chartererName,
        charterPartyDate: body.charter.charterPartyDate,
        laycanStart: body.charter.laycanStart,
        laycanEnd: body.charter.laycanEnd,
      };
    }

    // 6. Perform Update
    const updatedVoyage = await Voyage.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("vesselId", "name imo")
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName");

    return NextResponse.json({
      success: true,
      message: "Voyage updated successfully",
      report: updatedVoyage,
      data: updatedVoyage,
    });

  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("UPDATE VOYAGE ERROR →", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
/* ======================================
   DELETE VOYAGE
====================================== */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authorization
    const authz = await authorizeRequest("voyage.delete");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid voyage ID" }, { status: 400 });
    }

    // 2. Perform Delete
    const deletedVoyage = await Voyage.findByIdAndDelete(id);

    if (!deletedVoyage) {
      return NextResponse.json({ error: "Voyage not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Voyage deleted successfully",
    });

  } catch (error) {
    console.error("DELETE VOYAGE ERROR →", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}