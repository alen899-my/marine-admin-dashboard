import { dbConnect } from "@/lib/db";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
// MODEL
import ReportOperational from "@/models/ReportOperational";
import Voyage from "@/models/Voyage";

/* ======================================
   UPDATE ARRIVAL REPORT (PATCH)
====================================== */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeRequest("arrival.edit");
    if (!authz.ok) return authz.response;
    
    await dbConnect();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    const body = await req.json();

    // 1. ✅ VOYAGE LOOKUP LOGIC
    // Frontend sends 'voyageId' as a string (e.g. "OP-1225"). 
    // We need to find the real ObjectId from the Voyage collection.
    const voyageNoString = body.voyageId || body.voyageNo; 
    const vesselId = body.vesselId;
    
    let voyageObjectId = null;

    // Check if we have enough info to look up the new voyage ID
    if (vesselId && voyageNoString) {
       const foundVoyage = await Voyage.findOne({
          vesselId: vesselId,
          voyageNo: { $regex: new RegExp(`^${voyageNoString}$`, "i") } 
       }).select("_id");

       if (foundVoyage) {
          voyageObjectId = foundVoyage._id;
       }
    }

    // 2. Prepare the base update object
    const updateData: any = {
      vesselName: body.vesselName,
      
      // ✅ Update Linked IDs
      // Only update if we found a valid ID, otherwise keep existing (or let it fail validation if critical)
      ...(voyageObjectId && { voyageId: voyageObjectId }), 
      ...(vesselId && { vesselId: vesselId }),

      // ✅ Update Snapshot Strings
      ...(voyageNoString && { voyageNo: voyageNoString }), 

      portName: body.portName,
      remarks: body.remarks,
      status: body.status ?? "active",
    };

    // 3. Handle Dates
    if (body.reportDate) updateData.reportDate = new Date(body.reportDate);
    if (body.arrivalTime) updateData.eventTime = new Date(body.arrivalTime);

    // 4. Extract ROB and Cargo safely
    const robVlsfo = body.robVlsfo ?? body.arrivalStats?.robVlsfo;
    const robLsmgo = body.robLsmgo ?? body.arrivalStats?.robLsmgo;
    const cargoQty = body.arrivalCargoQty ?? body.arrivalStats?.arrivalCargoQtyMt;

    // 5. Update Nested arrivalStats
    updateData.arrivalStats = {
      arrivalTime: body.arrivalTime ? new Date(body.arrivalTime) : undefined,
      arrivalCargoQtyMt: cargoQty !== undefined ? Number(cargoQty) : 0,
      robVlsfo: robVlsfo !== undefined ? Number(robVlsfo) : 0,
      robLsmgo: robLsmgo !== undefined ? Number(robLsmgo) : 0,
    };

    // 6. Update Nested norDetails
    if (body.norTime) {
      updateData.norDetails = {
        norTime: new Date(body.norTime),
        tenderTime: new Date(body.norTime),
      };
    }

    const updatedReport = await ReportOperational.findOneAndUpdate(
      { _id: id, eventType: "arrival" },
      { $set: updateData },
      { new: true, runValidators: true }
    )
    // ✅ POPULATE Response so Frontend sees readable name immediately
    .populate("voyageId", "voyageNo"); 

    if (!updatedReport) {
      return NextResponse.json({ error: "Arrival report not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Arrival report updated successfully",
      report: updatedReport,
    });
  } catch (error) {
    console.error("UPDATE ARRIVAL REPORT ERROR →", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
/* ======================================
   DELETE ARRIVAL REPORT
====================================== */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    // ✅ IMPORTANT: await params
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    const deletedReport = await ReportOperational.findOneAndDelete({
      _id: id,
      eventType: "arrival",
    });

    if (!deletedReport) {
      return NextResponse.json(
        { error: "Arrival report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Arrival report deleted successfully",
    });
  } catch (error) {
    console.error("DELETE ARRIVAL REPORT ERROR →", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
