import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import { userGuideSchema } from "@/lib/validations/userGuideSchema";
import { ensureUserGuideSetup, getUserGuides } from "@/lib/services/userGuideService";
import UserGuide from "@/models/UserGuide";
import UserGuideGroup from "@/models/UserGuideGroup";
import Role from "@/models/Role";

export async function GET(req: NextRequest) {
  try {
    const authz = await authorizeRequest("userguide.view");
    if (!authz.ok) return authz.response;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const group = searchParams.get("group") || "all";

    const result = await getUserGuides({ page, limit, search, status, group });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch user guides" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authz = await authorizeRequest("userguide.create");
    if (!authz.ok) return authz.response;

    await ensureUserGuideSetup();
    await dbConnect();

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

    const createData = {
      ...value,
      assignedRoles: assignedRoleIds,
    };

    const created = await UserGuide.create(createData);

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create user guide" },
      { status: 500 },
    );
  }
}
