import { dbConnect } from "@/lib/db";
import ReportOperational from "@/models/ReportOperational";
import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
import Voyage from "@/models/Voyage";
import mongoose from "mongoose";
import { auth } from "@/auth";
/* ======================================
   UPDATE DEPARTURE REPORT (EDIT)
====================================== */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth(); // ✅ Get session
    const currentUserId = session?.user?.id;
    const authz = await authorizeRequest("departure.edit");
    if (!authz.ok) return authz.response;
    
    await dbConnect();
    const { id } = await context.params;
    const body = await req.json();

    const report = await ReportOperational.findOne({
      _id: id,
      eventType: "departure",
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // ✅ VOYAGE LOOKUP LOGIC FOR EDIT
    const newVoyageNoString = body.voyageNo || body.voyageId; 
    const vesselId = body.vesselId || report.vesselId; 

    if (newVoyageNoString) {
       const foundVoyage = await Voyage.findOne({
          vesselId: vesselId,
          voyageNo: { $regex: new RegExp(`^${newVoyageNoString}$`, "i") }
       }).select("_id");

       if (foundVoyage) {
          report.voyageId = foundVoyage._id; 
          report.voyageNo = newVoyageNoString; 
       }
    }

    // ✅ FIX: Cast to ObjectId so Mongoose registers the update
    if (currentUserId) {
      report.updatedBy = new mongoose.Types.ObjectId(currentUserId) as any;
    }

    // Update other fields
    report.vesselName = body.vesselName;
    if(body.vesselId) report.vesselId = body.vesselId;
    
    report.portName = body.portName;
    report.lastPort = body.lastPort;
    report.eventTime = new Date(body.eventTime);
    report.reportDate = new Date(body.reportDate);

    report.navigation = {
      distanceToNextPortNm: body.navigation?.distance_to_next_port_nm,
      etaNextPort: body.navigation?.etaNextPort ? new Date(body.navigation.etaNextPort) : null,
    };

    report.departureStats = {
      robVlsfo: body.departureStats?.robVlsfo,
      robLsmgo: body.departureStats?.robLsmgo,
      bunkersReceivedVlsfo: body.departureStats?.bunkers_received_vlsfo_mt,
      bunkersReceivedLsmgo: body.departureStats?.bunkers_received_lsmgo_mt,
      cargoQtyLoadedMt: body.departureStats?.cargo_qty_loaded_mt,
      cargoQtyUnloadedMt: body.departureStats?.cargo_qty_unloaded_mt,
      cargoSummary: body.departureStats?.cargoSummary,
    };

    report.remarks = body.remarks;
    report.status = body.status;

    await report.save();

    // ✅ FIX: Re-populate to ensure the frontend receives the 'fullName' of the updater
    const updatedReport = await ReportOperational.findById(report._id)
      .populate("voyageId", "voyageNo")
      .populate("vesselId", "name")
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName")
      .lean();

    return NextResponse.json({
      success: true,
      message: "Report updated",
      report: updatedReport,
    });
  } catch (error) {
    console.error("UPDATE ERROR →", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
/* ======================================
   DELETE DEPARTURE REPORT
====================================== */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeRequest("departure.delete");
    if (!authz.ok) return authz.response;
    await dbConnect();

    // ✅ IMPORTANT: await params
    const { id } = await context.params;

    // ✅ Perform Soft Delete
    // Instead of findOneAndDelete, we use findOneAndUpdate to set the deletedAt timestamp.
    // We also include eventType: "departure" to ensure the correct record type is targeted.
    const deleted = await ReportOperational.findOneAndUpdate(
      {
        _id: id,
        eventType: "departure",
        deletedAt: null, // Ensure we are not updating an already deleted report
      },
      {
        $set: {
          deletedAt: new Date(),
          status: "inactive",
        },
      },
      { new: true }
    );

    if (!deleted) {
      return NextResponse.json(
        { error: "Departure report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Departure report deleted successfully",
    });
  } catch (error) {
    console.error("DELETE DEPARTURE REPORT ERROR →", error);
    return NextResponse.json(
      { error: "Failed to delete departure report" },
      { status: 500 }
    );
  }
}
