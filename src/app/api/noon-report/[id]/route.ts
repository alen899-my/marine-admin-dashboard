import { auth } from "@/auth";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import ReportDaily from "@/models/ReportDaily";
import Voyage from "@/models/Voyage"; // ✅ Import Voyage for ID lookup
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Authentication & Session logic (Mirroring Voyage logic)
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentUserId = session.user.id;

    // 2. Authorization
    const authz = await authorizeRequest("noon.edit");
    if (!authz.ok) return authz.response;

    await dbConnect();

    const { id } = await params;
    const body = await req.json();

    // 3. Prepare Voyage Linkage
    const voyageNoString = body.voyageNo || body.voyageId;
    const vesselId = body.vesselId;

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

    // Block if data integrity is at risk
    if (!voyageObjectId) {
      return NextResponse.json(
        { error: "Voyage not found for selected vessel" },
        { status: 400 },
      );
    }

    // 4. Construct Update Object (Ensures updatedBy is handled properly)
    const updateData: any = {
      vesselId: vesselId,
      voyageId: voyageObjectId,
      updatedBy: currentUserId, // Persistence fix
      vesselName: body.vesselName,
      voyageNo: voyageNoString,
      type: body.type,
      status: body.status,
      reportDate: body.reportDate ? new Date(body.reportDate) : undefined,
      remarks: body.remarks,
    };

    // Safely map nested objects
    if (body.position) updateData.position = { ...body.position };
    if (body.navigation) updateData.navigation = { ...body.navigation };
    if (body.consumption) updateData.consumption = { ...body.consumption };
    if (body.weather) updateData.weather = { ...body.weather };

    // 5. Perform the Update with $set
    const updated = await ReportDaily.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    )
      .populate({
        path: "vesselId",
        select: "name company",
        populate: {
          path: "company",
          select: "name",
        },
      })
      .populate("voyageId", "voyageNo")
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName");

    if (!updated) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      report: updated,
      message: "Report updated successfully",
    });
  } catch (error: any) {
    console.error("UPDATE NOON REPORT ERROR →", error);
    return NextResponse.json(
      { error: error.message || "Failed to update report" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authz = await authorizeRequest("noon.delete");
    if (!authz.ok) return authz.response;

    await dbConnect();

    // ✅ IMPORTANT: await params
    const { id } = await params;

    // ✅ Perform Soft Delete
    // Instead of findByIdAndDelete, we update the record to mark it as deleted.
    // We update the status to "deleted" and set the deletedAt timestamp.
    const report = await ReportDaily.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "inactive",
          deletedAt: new Date(),
        },
      },
      { new: true }, // Returns the updated document
    );

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
      { status: 500 },
    );
  }
}
