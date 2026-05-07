import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { getSchemaCards } from "@/lib/Getschemacards";

export async function GET(req: NextRequest) {
  try {
    const authz = await authorizeRequest([
      "templates.view",
      "templates.create",
      "templates.edit",
      "contracts.view",
    ]);
    if (!authz.ok) return authz.response;

    const { searchParams } = new URL(req.url);
    const requestedCompanyId = searchParams.get("companyId") || "";
    const session = authz.session!;
    const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
    const companyId = isSuperAdmin
      ? requestedCompanyId
      : session.user.company?.id || "";

    if (companyId && !mongoose.isValidObjectId(companyId)) {
      return NextResponse.json(
        { error: "Invalid company ID" },
        { status: 400 },
      );
    }

    const cards = await getSchemaCards(companyId);
    return NextResponse.json({ success: true, data: cards });
  } catch (error) {
    console.error("GET /api/sea-templates/placeholders", error);
    return NextResponse.json(
      { error: "Failed to load SEA template placeholders" },
      { status: 500 },
    );
  }
}
