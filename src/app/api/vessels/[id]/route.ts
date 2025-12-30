import { dbConnect } from "@/lib/db";
import { authorizeRequest } from "@/lib/authorizeRequest";
import Vessel from "@/models/Vessel";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth"; // ✅ IMPORT AUTH
/* ======================================
   UPDATE VESSEL (PATCH)
====================================== */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeRequest("vessels.edit");
    if (!authz.ok) return authz.response;
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentUserId = session.user.id;
    await dbConnect();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid vessel ID" }, { status: 400 });
    }

    const body = await req.json();

    // ❌ REMOVED: Manual check for duplicate IMO. 
    // The DB update below will fail if Name or IMO is duplicate.

    const updateData: any = {
      name: body.name,
      imo: body.imo,
      fleet: body.fleet,
      status: body.status,
      callSign: body.callSign,
      mmsi: body.mmsi,
      flag: body.flag,
      yearBuilt: body.yearBuilt,
      updatedBy: currentUserId,
    };

    // ... (Keep your existing nested object logic for dimensions, performance, machinery)
    if (body.dimensions) {
      updateData.dimensions = { ...body.dimensions };
    }
    if (body.performance) {
      updateData.performance = { ...body.performance };
    }
    if (body.machinery) {
      updateData.machinery = { ...body.machinery };
    }

    // 4. Update in Database
    const updatedVessel = await Vessel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedVessel) {
      return NextResponse.json({ error: "Vessel not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedVessel,
    });

  } catch (error: any) {
    // ✅ HANDLE DUPLICATES HERE (Covers Name AND IMO updates)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const label = field === "imo" ? "IMO Number" : "Vessel Name";
      return NextResponse.json(
        { error: `${label} already exists.` },
        { status: 409 }
      );
    }

    console.error("UPDATE VESSEL ERROR →", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
/* ======================================
   DELETE VESSEL
====================================== */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authorization
    const authz = await authorizeRequest("vessels.delete");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid vessel ID" }, { status: 400 });
    }

    // 2. Perform Delete
    const deletedVessel = await Vessel.findByIdAndDelete(id);

    if (!deletedVessel) {
      return NextResponse.json(
        { error: "Vessel not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Vessel deleted successfully",
    });

  } catch (error) {
    console.error("DELETE VESSEL ERROR →", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}