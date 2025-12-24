import { dbConnect } from "@/lib/db";
import ReportOperational from "@/models/ReportOperational";
import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
/* ======================================
   UPDATE DEPARTURE REPORT (EDIT)
====================================== */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
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
      return NextResponse.json(
        { error: "Departure report not found" },
        { status: 404 }
      );
    }

    // ✅ Update fields (no schema re-validation needed here)
    report.vesselName = body.vesselName;
    report.voyageId = body.voyageId;
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

    return NextResponse.json({
      success: true,
      message: "Departure report updated successfully",
      report,
    });
  } catch (error) {
    console.error("UPDATE DEPARTURE REPORT ERROR →", error);
    return NextResponse.json(
      { error: "Failed to update departure report" },
      { status: 500 }
    );
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
    const { id } = await context.params;
    const deleted = await ReportOperational.findOneAndDelete({
      _id: id,
      eventType: "departure",
    });

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
