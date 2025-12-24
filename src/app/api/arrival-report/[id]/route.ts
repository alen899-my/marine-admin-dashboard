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

    const body = await req.json();

    const updatedReport = await ReportOperational.findOneAndUpdate(
      { _id: id, eventType: "arrival" },
      {
        vesselName: body.vesselName,
        voyageId: body.voyageId,
        portName: body.portName,
        reportDate: body.reportDate ? new Date(body.reportDate) : undefined,
        eventTime: body.arrivalTime ? new Date(body.arrivalTime) : undefined,
        arrivalStats: body.arrivalStats,
        remarks: body.remarks,
        status: body.status ?? "active",
      },
      { new: true }
    );

    if (!updatedReport) {
      return NextResponse.json(
        { error: "Arrival report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Arrival report updated successfully",
      report: updatedReport,
    });
  } catch (error) {
    console.error("UPDATE ARRIVAL REPORT ERROR →", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
