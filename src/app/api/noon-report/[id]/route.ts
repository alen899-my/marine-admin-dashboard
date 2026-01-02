import { dbConnect } from "@/lib/db";
import ReportDaily from "@/models/ReportDaily";
import Voyage from "@/models/Voyage"; // ✅ Import Voyage for ID lookup
import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { auth } from "@/auth"; 
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth(); // ✅ Get session
    const currentUserId = session?.user?.id;
    const authz = await authorizeRequest("noon.edit");
    if (!authz.ok) return authz.response;
    
    await dbConnect();

    const { id } = await params;
    const body = await req.json();

    // 1. Prepare Snapshot Data
    // Frontend sends 'voyageId' as a string (voyageNo) in the edit state
    const voyageNoString = body.voyageNo || body.voyageId; 
    const vesselId = body.vesselId;

    // 2. Lookup the correct Voyage ObjectId (Linkage)
    let voyageObjectId = null;
    if (vesselId && voyageNoString) {
      const foundVoyage = await Voyage.findOne({
        vesselId: vesselId,
        voyageNo: voyageNoString,
      }).select("_id");

      if (foundVoyage) {
        voyageObjectId = foundVoyage._id;
      }
    }
    // 🔥 BLOCK INVALID UPDATE
if (!voyageObjectId) {
  return NextResponse.json(
    { error: "Voyage not found for selected vessel" },
    { status: 400 }
  );
}

    // 3. Update with Population
    // .populate ensures the frontend receives the objects needed for display helpers
    const updated = await ReportDaily.findByIdAndUpdate(
      id,
      {
        // ✅ Relation Fields
        vesselId: vesselId, 
        voyageId: voyageObjectId, 
        updatedBy: currentUserId,

        // ✅ Snapshot Fields
        vesselName: body.vesselName,
        voyageNo: voyageNoString, 

        type: body.type,
        status: body.status,
        reportDate: body.reportDate ? new Date(body.reportDate) : undefined,

        position: {
          lat: body.position?.lat,
          long: body.position?.long,
        },

        navigation: {
          distLast24h: body.navigation?.distLast24h,
          engineDist: body.navigation?.engineDist,
          slip: body.navigation?.slip,
          distToGo: body.navigation?.distToGo,
          nextPort: body.navigation?.nextPort,
        },

        consumption: {
          vlsfo: body.consumption?.vlsfo,
          lsmgo: body.consumption?.lsmgo,
        },

        weather: {
          wind: body.weather?.wind,
          seaState: body.weather?.seaState,
          remarks: body.weather?.remarks,
        },

        remarks: body.remarks,
      },
      { new: true, runValidators: true }
    )
    .populate("vesselId", "name")
    .populate("voyageId", "voyageNo");

    if (!updated) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Return the populated report so the state update in React is seamless
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