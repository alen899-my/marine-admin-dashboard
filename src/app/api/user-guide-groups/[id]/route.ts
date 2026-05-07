import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import { userGuideGroupSchema } from "@/lib/validations/userGuideGroupSchema";
import UserGuide from "@/models/UserGuide";
import UserGuideGroup from "@/models/UserGuideGroup";

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
    const { error, value } = userGuideGroupSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return NextResponse.json(
        { error: error.details[0]?.message || "Invalid request" },
        { status: 400 },
      );
    }

    const duplicate = await UserGuideGroup.findOne({
      _id: { $ne: id },
      deletedAt: null,
      name: { $regex: new RegExp(`^${value.name}$`, "i") },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "Another group already uses this name" },
        { status: 409 },
      );
    }

    const updated = await UserGuideGroup.findByIdAndUpdate(
      id,
      { $set: value },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update user guide group" },
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

    const inUse = await UserGuide.findOne({ groupId: id, deletedAt: null });
    if (inUse) {
      return NextResponse.json(
        { error: "This group is already used by user guides" },
        { status: 409 },
      );
    }

    const deleted = await UserGuideGroup.findByIdAndDelete(
      id,
     
    );

    if (!deleted) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Group deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete user guide group" },
      { status: 500 },
    );
  }
}
