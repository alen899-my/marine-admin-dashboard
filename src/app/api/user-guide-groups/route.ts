import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import { ensureUserGuideSetup, getUserGuideGroups } from "@/lib/services/userGuideService";
import { userGuideGroupSchema } from "@/lib/validations/userGuideGroupSchema";
import UserGuideGroup from "@/models/UserGuideGroup";

export async function GET(req: NextRequest) {
  try {
    const authz = await authorizeRequest("userguide.view");
    if (!authz.ok) return authz.response;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const limitParam = searchParams.get("limit") || "20";

    if (limitParam === "none") {
      await ensureUserGuideSetup();
      await dbConnect();
      const query: any = { deletedAt: null };
      if (status !== "all") query.status = status;
      if (search.trim()) query.name = { $regex: search.trim(), $options: "i" };

      const groups = await UserGuideGroup.find(query)
        .sort({ sortOrder: 1, name: 1 })
        .select("name sortOrder status")
        .lean();

      return NextResponse.json(groups);
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(limitParam, 10);
    const result = await getUserGuideGroups({ page, limit, search, status });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch user guide groups" },
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
      deletedAt: null,
      name: { $regex: new RegExp(`^${value.name}$`, "i") },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "A group with this name already exists" },
        { status: 409 },
      );
    }

    const created = await UserGuideGroup.create(value);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create user guide group" },
      { status: 500 },
    );
  }
}
