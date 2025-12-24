import { dbConnect } from "@/lib/db";
import ReportDaily from "@/models/ReportDaily";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth"; 
import { authorizeRequest } from "@/lib/authorizeRequest";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeRequest("noon.edit");
if (!authz.ok) return authz.response;
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
        reportDate: new Date(body.reportDate),

        position: {
          lat: body.position?.lat,
          long: body.position?.long,
        },

        navigation: {
          distLast24h: body.navigation?.distLast24h, // Observed Distance
          engineDist: body.navigation?.engineDist,   // ***** NEW FIELD *****
          slip: body.navigation?.slip,               // ***** NEW FIELD *****
          distToGo: body.navigation?.distToGo,
          nextPort: body.navigation?.nextPort,
        },

        consumption: {
          vlsfo: body.consumption?.vlsfo, // Fuel 24h - VLSFO
          lsmgo: body.consumption?.lsmgo, // Fuel 24h - LSMGO
        },

        weather: {
          wind: body.weather?.wind,
          seaState: body.weather?.seaState,
          remarks: body.weather?.remarks,
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
    const authz = await authorizeRequest("noon.delete");
if (!authz.ok) return authz.response;
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