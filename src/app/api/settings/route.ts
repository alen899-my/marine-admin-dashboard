import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
import {
  getSettings,
  updateSettings,
} from "@/lib/systemSettings.server";

export async function GET(req: NextRequest) {
  try {
    const authz = await authorizeRequest("settings.manage");
    if (!authz.ok) return authz.response;
    const isSuperAdmin =
      authz.session?.user?.role?.toLowerCase() === "super-admin";

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId") || undefined;

    if (!companyId && !isSuperAdmin) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 },
      );
    }

    const settings = await getSettings({ companyId });
    return NextResponse.json(settings);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load settings";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authz = await authorizeRequest("settings.manage");
    if (!authz.ok) return authz.response;
    const isSuperAdmin =
      authz.session?.user?.role?.toLowerCase() === "super-admin";

    const body = await req.json();
    const companyId = body?.companyId;

    // Only include fields that were actually provided in the request
    const updateData: Record<string, unknown> = { companyId };

    if (!companyId && !isSuperAdmin) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 },
      );
    }

    // Add payroll setting only if explicitly provided
    if (body?.captainOnlyVerification !== undefined) {
      updateData.captainOnlyVerification = Boolean(body.captainOnlyVerification);
    }
    if (body?.showOnGlobalCareersPage !== undefined) {
      updateData.showOnGlobalCareersPage = Boolean(body.showOnGlobalCareersPage);
    }
    if (body?.publicCareersPageEnabled !== undefined) {
      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: "Only super admin can update public careers visibility." },
          { status: 403 },
        );
      }
      updateData.publicCareersPageEnabled = Boolean(body.publicCareersPageEnabled);
    }
    if (body?.companyCareersPageEnabled !== undefined) {
      updateData.companyCareersPageEnabled = Boolean(body.companyCareersPageEnabled);
    }
    // Add currency formatting settings only if explicitly provided
    if (body?.currencyPosition !== undefined) {
      updateData.currencyPosition = body.currencyPosition;
    }
    if (body?.currencyFormatType !== undefined) {
      updateData.currencyFormatType = body.currencyFormatType;
    }
    if (body?.currencySpace !== undefined) {
      updateData.currencySpace = body.currencySpace;
    }

    const settings = await updateSettings(updateData);

    return NextResponse.json(settings);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update settings";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
