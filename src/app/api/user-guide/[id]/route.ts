import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import { userGuideSchema } from "@/lib/validations/userGuideSchema";
import UserGuide from "@/models/UserGuide";
import UserGuideGroup from "@/models/UserGuideGroup";
import Role from "@/models/Role";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authz = await authorizeRequest("userguide.edit");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const { error, value } = userGuideSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return NextResponse.json(
        { error: error.details[0]?.message || "Invalid request" },
        { status: 400 },
      );
    }

    const existingGuides = await UserGuide.find({
      _id: { $ne: id },
      deletedAt: null,
      groupId: value.groupId,
      title: { $regex: new RegExp(`^${value.title}$`, "i") },
    });

    const assignedRoleIds: mongoose.Types.ObjectId[] = [];
    if (value.assignedRoles && value.assignedRoles.length > 0) {
      const roles = await Role.find({
        name: { $in: value.assignedRoles }
      }).select("_id");
      assignedRoleIds.push(...roles.map(r => r._id));
    }

    if (existingGuides.length > 0) {
      for (const existing of existingGuides) {
        const existingRoles = existing.assignedRoles || [];
        const hasOverlap = assignedRoleIds.some((r: mongoose.Types.ObjectId) =>
          existingRoles.some((er: mongoose.Types.ObjectId) => er.equals(r))
        );
        if (hasOverlap) {
          return NextResponse.json(
            { error: "A user guide with this section, sub item and role already exists" },
            { status: 409 },
          );
        }
      }
    }

    const group = await UserGuideGroup.findOne({
      _id: value.groupId,
      deletedAt: null,
    });
    if (!group) {
      return NextResponse.json({ error: "Selected group not found" }, { status: 404 });
    }

    const updateData = {
      ...value,
      assignedRoles: assignedRoleIds,
    };

    const updated = await UserGuide.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return NextResponse.json({ error: "User guide not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update user guide" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authz = await authorizeRequest("userguide.delete");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const { id } = await params;

    const deleted = await UserGuide.findByIdAndDelete(
      id,

    );

    if (!deleted) {
      return NextResponse.json({ error: "User guide not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "User guide deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete user guide" },
      { status: 500 },
    );
  }
}
