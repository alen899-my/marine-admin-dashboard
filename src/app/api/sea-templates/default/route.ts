import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest"; // ✅ Added Auth check
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { getSettings } from "@/lib/systemSettings.server";
import SeaTemplate from "@/models/Seatemplate";
import mongoose from "mongoose";

/**
 * GET /api/sea-templates/default?companyId=xxx
 * Returns the default (or first active) SEA template for a company.
 */
export async function GET(req: NextRequest) {
  try {
    const authz = await authorizeRequest("contracts.view");
    if (!authz.ok) return authz.response;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId || !mongoose.isValidObjectId(companyId)) {
      return NextResponse.json({ success: false, error: "Invalid companyId" }, { status: 400 });
    }

    await dbConnect();

    const query = {
      company: new mongoose.Types.ObjectId(companyId),
      deletedAt: null,
      status: "active",
    };

    // Prefer the isDefault template; fall back to the most recently updated one
    let template = await SeaTemplate.findOne({ ...query, isDefault: true })
      .populate("company", "name logo address phone email currency")
      .lean();

    if (!template) {
      template = await SeaTemplate.findOne(query)
        .populate("company", "name logo address phone email currency")
        .sort({ updatedAt: -1 })
        .lean();
    }

    if (!template) {
      return NextResponse.json({ success: false, error: "No template found" }, { status: 404 });
    }

    const settings = await getSettings({ companyId });
    const data = {
      ...template,
      currencySettings: {
        currencyPosition: settings.currencyPosition,
        currencyFormatType: settings.currencyFormatType,
        currencySpace: settings.currencySpace,
      },
    };

    return NextResponse.json({ success: true, data: JSON.parse(JSON.stringify(data)) });
  } catch (err) {
    console.error("GET /api/sea-templates/default", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
