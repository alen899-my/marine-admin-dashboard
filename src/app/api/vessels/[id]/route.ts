import { dbConnect } from "@/lib/db";
import { authorizeRequest } from "@/lib/authorizeRequest";
import Vessel from "@/models/Vessel";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth"; // ✅ IMPORT AUTH
import Company from "@/models/Company";
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

    const existingVessel = await Vessel.findById(id);
    if (!existingVessel) {
      return NextResponse.json({ error: "Vessel not found" }, { status: 404 });
    }

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

    if (body.company && body.company !== existingVessel.company?.toString()) {
      // Validate new company exists
      const newCompany = await Company.findById(body.company);
      if (!newCompany) {
        return NextResponse.json({ error: "Invalid Company ID" }, { status: 400 });
      }

      updateData.company = body.company;

      // Remove from old company list
      if (existingVessel.company) {
        await Company.findByIdAndUpdate(existingVessel.company, {
          $pull: { vessels: id }
        });
      }

      // Add to new company list
      await Company.findByIdAndUpdate(body.company, {
        $addToSet: { vessels: id }
      });
    }
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
    )
    .populate("company", "name") // ✅ ADD THIS: Return company object, not just ID
    .populate("createdBy", "fullName") // ✅ Ensure consistency for UI display
    .populate("updatedBy", "fullName");

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

    // 2. Perform Soft Delete
    // We update the deletedAt timestamp and set status to inactive or sold 
    // depending on your preference. Here we keep your existing enum logic.
    const deletedVessel = await Vessel.findByIdAndUpdate(
      id,
      {
        $set: {
          deletedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!deletedVessel) {
      return NextResponse.json(
        { error: "Vessel not found" },
        { status: 404 }
      );
    }

    // 3. Remove Vessel from Company's active vessels list
    // We still pull the ID from the Company array so that the "delete company" 
    // validation logic works correctly.
    if (deletedVessel.company) {
      await Company.findByIdAndUpdate(deletedVessel.company, {
        $pull: { vessels: id }
      });
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