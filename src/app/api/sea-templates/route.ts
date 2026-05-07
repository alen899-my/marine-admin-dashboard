import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import SeaTemplate from "@/models/Seatemplate";
import Company from "@/models/Company";
import { handleUpload } from "@/lib/handleUpload";
import { buildCompanyUploadFolder } from "@/lib/uploadFolders";
import mongoose from "mongoose";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { getSettings } from "@/lib/systemSettings.server";

export async function GET(req: NextRequest) {
  try {
    const authz = await authorizeRequest(["templates.view", "contracts.view"]);
    if (!authz.ok) return authz.response;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const requestedCompanyId = searchParams.get("companyId");
    const companyId =
      session.user.role?.toLowerCase() === "super-admin"
        ? requestedCompanyId
        : session.user.company?.id;

    if (!companyId || !mongoose.isValidObjectId(companyId)) {
      return NextResponse.json({ success: false, error: "Invalid company" }, { status: 400 });
    }

    const status = searchParams.get("status");
    const query: any = {
      company: new mongoose.Types.ObjectId(companyId),
      deletedAt: null,
    };

    if (status && status !== "all") {
      query.status = status;
    }

    const templates = await SeaTemplate.find(query)
      .select("name isDefault status updatedAt")
      .sort({ isDefault: -1, updatedAt: -1 })
      .lean();

    const settings = await getSettings({ companyId });

    return NextResponse.json({
      success: true,
      data: JSON.parse(JSON.stringify(templates)),
      currencySettings: {
        currencyPosition: settings.currencyPosition,
        currencyFormatType: settings.currencyFormatType,
        currencySpace: settings.currencySpace,
      },
    });
  } catch (err) {
    console.error("GET /api/sea-templates", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}



export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const authz = await authorizeRequest("templates.create");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const fd = await req.formData();

    const companyId    = fd.get("companyId") as string;
    const name         = fd.get("name") as string;

    if (!companyId || !mongoose.isValidObjectId(companyId))
      return NextResponse.json({ success: false, error: "Invalid company" }, { status: 400 });
    if (!name?.trim())
      return NextResponse.json({ success: false, error: "Template name required" }, { status: 400 });

    const company = await Company.findById(companyId).select("name").lean();
    if (!company) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }
    const templateUploadFolder = buildCompanyUploadFolder({
      companyName: company.name,
      module: "sea-templates",
      subfolder: session.user.fullName,
      entityName: name,
    });

    let logoUrl: string | undefined;
    let letterheadBgUrl: string | undefined;

    const logoFile = fd.get("logoFile") as File | null;
    if (logoFile instanceof File) {
      logoUrl = (await handleUpload(logoFile, `${templateUploadFolder}/logo`)).url;
    } else {
      logoUrl = (fd.get("logoUrl") as string) || undefined;
    }

    const bgFile = fd.get("letterheadBgFile") as File | null;
    if (bgFile instanceof File) {
      letterheadBgUrl = (await handleUpload(bgFile, `${templateUploadFolder}/bg`)).url;
    } else {
      letterheadBgUrl = (fd.get("letterheadBgUrl") as string) || undefined;
    }

    const isDefault = fd.get("isDefault") === "true";
    if (isDefault) {
      await SeaTemplate.updateMany(
        { company: new mongoose.Types.ObjectId(companyId), isDefault: true },
        { isDefault: false }
      );
    }

    const sectionsRaw = fd.get("sections") as string;
    let sections = sectionsRaw ? JSON.parse(sectionsRaw) : [];

    // Filter sections and provide default titles for tables
    sections = sections.map((s: any, i: number) => ({
      ...s,
      title: s.title ? s.title : 
               (s.type === "seafarer_table" ? "Seafarer Details" :
               s.type === "vessel_table" ? "Vessel Details" :
               s.type === "wage_table" ? "Wages" :
               s.type === "disability_table" ? "Disability Compensation" :
               s.type === "signature_block" ? "Signatures" : `Section ${i + 1}`),
      key: s.id || s.key,
      columns: s.columns || [],
    }));

    const template = await SeaTemplate.create({
      name:            name.trim(),
      company:         new mongoose.Types.ObjectId(companyId),
      logoUrl,
      letterheadBgUrl,
      headerAddress:    (fd.get("headerAddress") as string) || "",
      footerText:       (fd.get("footerText") as string) || "",
      footerBgColor:    (fd.get("footerBgColor") as string) || "",
      footerTextColor:  (fd.get("footerTextColor") as string) || "#000000",
      primaryColor:     (fd.get("primaryColor") as string) || "#1e40af",
      mainHeading:     (fd.get("mainHeading") as string) || "",
      subHeading:      (fd.get("subHeading") as string) || "",
      sections,
      cbaReference:    (fd.get("cbaReference") as string) || "",
      mlcReference:    (fd.get("mlcReference") as string) || "",
      deathBenefitUSD:     Number(fd.get("deathBenefitUSD"))     || 114018,
      dependentBenefitUSD: Number(fd.get("dependentBenefitUSD")) || 22805,
      maxDependents:       Number(fd.get("maxDependents"))       || 4,
      dependentAgeLimit:   Number(fd.get("dependentAgeLimit"))   || 18,
      isDefault,
      status: "active",
      createdBy: (session.user as any).id,
    });

    return NextResponse.json({ success: true, data: JSON.parse(JSON.stringify(template)) });
  } catch (err) {
    console.error("POST /api/sea-templates", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
