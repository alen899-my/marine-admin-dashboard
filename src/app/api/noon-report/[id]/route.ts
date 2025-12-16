import { dbConnect } from "@/lib/db";
import ReportDaily from "@/models/ReportDaily";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const body = await req.json();

    const updated = await ReportDaily.findByIdAndUpdate(
      id,
      {
        vesselName: body.vesselName,
        voyageId: body.voyageId,
        type: body.type,
        status: body.status,
        // ***** CHANGE: Update Date Object *****
        reportDate: new Date(body.reportDate),

        position: {
          lat: body.position.lat,
          long: body.position.long,
        },

        navigation: {
          distLast24h: body.navigation.distLast24h,
          distToGo: body.navigation.distToGo,
          nextPort: body.navigation.nextPort,
        },

        consumption: {
          vlsfo: body.consumption.vlsfo,
          lsmgo: body.consumption.lsmgo,
        },

        weather: {
          wind: body.weather.wind,
          seaState: body.weather.seaState,
          remarks: body.weather.remarks,
        },

        remarks: body.remarks,
      },
      { new: true, runValidators: true }
    ).populate({
      path: "voyageId",
      populate: { path: "vesselId" },
    });

    if (!updated) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, report: updated });
  } catch (error) {
    console.error("UPDATE ERROR →", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    const report = await ReportDaily.findByIdAndDelete(id);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error("DELETE NOON REPORT ERROR →", error);
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    );
  }
}