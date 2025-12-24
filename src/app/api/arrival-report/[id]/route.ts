import { dbConnect } from "@/lib/db";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
// MODEL
import ReportOperational from "@/models/ReportOperational";


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

    // 1. Prepare the base update object
    const updateData: any = {
      vesselName: body.vesselName,
      voyageId: body.voyageId,
      portName: body.portName,
      remarks: body.remarks,
      status: body.status ?? "active",
    };

    // 2. Handle Dates
    if (body.reportDate) updateData.reportDate = new Date(body.reportDate);
    if (body.arrivalTime) updateData.eventTime = new Date(body.arrivalTime);

    // 3. Extract ROB and Cargo safely
    // We check both the root (body.robVlsfo) and the nested object (body.arrivalStats?.robVlsfo)
    const robVlsfo = body.robVlsfo ?? body.arrivalStats?.robVlsfo;
    const robLsmgo = body.robLsmgo ?? body.arrivalStats?.robLsmgo;
    const cargoQty = body.arrivalCargoQty ?? body.arrivalStats?.arrivalCargoQtyMt;

    // 4. Update Nested arrivalStats
    updateData.arrivalStats = {
      arrivalTime: body.arrivalTime ? new Date(body.arrivalTime) : undefined,
      arrivalCargoQtyMt: cargoQty !== undefined ? Number(cargoQty) : 0,
      robVlsfo: robVlsfo !== undefined ? Number(robVlsfo) : 0,
      robLsmgo: robLsmgo !== undefined ? Number(robLsmgo) : 0,
    };

    // 5. Update Nested norDetails
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
    );

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
