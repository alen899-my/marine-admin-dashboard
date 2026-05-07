// src/app/api/sea-templates/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import SeaTemplate from "@/models/Seatemplate";
import { handleUpload } from "@/lib/handleUpload";
import { buildCompanyUploadFolder } from "@/lib/uploadFolders";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { del } from "@vercel/blob";
import { unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { getSettings } from "@/lib/systemSettings.server";
import mongoose from "mongoose";

async function deleteFile(fileUrl: string) {
  if (!fileUrl) return;
  try {
    if (process.env.UPLOAD_PROVIDER === "local") {
      let urlPath = fileUrl;
      if (fileUrl.startsWith("http")) {
        urlPath = new URL(fileUrl).pathname;
      }
      const uploadsPrefix = "/uploads/";
      if (urlPath.startsWith(uploadsPrefix)) {
        const relativePath = urlPath.slice(uploadsPrefix.length);
        const filePath = path.join(process.cwd(), "public", "uploads", relativePath);
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      }
    } else {
      if (fileUrl.startsWith("http")) {
        await del(fileUrl);
      }
    }
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}

async function canDeleteFileReference(
  templateId: string,
  field: "logoUrl" | "letterheadBgUrl",
  fileUrl: string,
) {
  const existingReference = await SeaTemplate.exists({
    _id: { $ne: templateId },
    deletedAt: null,
    [field]: fileUrl,
  });

  return !existingReference;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false }, { status: 401 });

    const authz = await authorizeRequest(["templates.view", "contracts.view"]);
    if (!authz.ok) return authz.response;

    await dbConnect();
    const { id } = await params;
    const template = await SeaTemplate.findOne({ _id: id, deletedAt: null })
      .populate("company", "name logo address phone email rpslNo rpslValidity currency")
      .lean();
    if (!template) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    const companyId = String((template as any).company?._id || (template as any).company || "");
    const settings = companyId ? await getSettings({ companyId }) : null;
    return NextResponse.json({
      success: true,
      data: JSON.parse(JSON.stringify({
        ...template,
        currencySettings: settings
          ? {
              currencyCode: settings.currencyCode,
              currencyPosition: settings.currencyPosition,
              currencyFormatType: settings.currencyFormatType,
              currencySpace: settings.currencySpace,
            }
          : undefined,
      })),
    });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false }, { status: 401 });

    const authz = await authorizeRequest("templates.edit");
    if (!authz.ok) return authz.response;

    await dbConnect();

    const { id } = await params;
    const fd = await req.formData();
    const updates: any = { updatedBy: (session.user as any).id };
    const existingTemplate = await SeaTemplate.findById(id)
      .select("name company logoUrl letterheadBgUrl")
      .populate("company", "name")
      .lean() as any;
    if (!existingTemplate) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    // ── Simple string fields
    const stringFields = [
      "name",
      "headerAddress",
      "footerText",
      "footerBgColor",
      "footerTextColor",
      "primaryColor",
      "mainHeading",
      "subHeading",
      "cbaReference",
      "mlcReference",
      "status",
    ] as const;

    for (const f of stringFields) {
      const v = fd.get(f) as string | null;
      if (v !== null) updates[f] = f === "name" ? v.trim() : v;
    }

    // ── Company update
    const companyId = fd.get("companyId") as string | null;
    if (companyId && mongoose.isValidObjectId(companyId)) {
      updates.company = new mongoose.Types.ObjectId(companyId);
    }

    // ── Numeric fields
    const numFields = [
      "deathBenefitUSD",
      "dependentBenefitUSD",
      "maxDependents",
      "dependentAgeLimit",
    ] as const;

    for (const f of numFields) {
      const v = fd.get(f);
      if (v !== null) updates[f] = Number(v);
    }

    // ── Sections
    const sectionsRaw = fd.get("sections") as string | null;
    if (sectionsRaw) {
      let sections = JSON.parse(sectionsRaw);
      sections = sections.map((s: any) => ({
        ...s,
        title:   s.title || "",
        key:     s.id || s.key,
        columns: s.columns || [],
      }));
      updates.sections = sections;
    }

    // ── isDefault
    const isDefaultRaw = fd.get("isDefault");
    if (isDefaultRaw !== null) {
      updates.isDefault = isDefaultRaw === "true";
      if (updates.isDefault) {
        const targetCompanyId = updates.company || existingTemplate.company?._id || existingTemplate.company;
        if (targetCompanyId) {
          await SeaTemplate.updateMany(
            { company: targetCompanyId, isDefault: true, _id: { $ne: id } },
            { isDefault: false }
          );
        }
      }
    }

    // ── File uploads
    const templateUploadFolder = buildCompanyUploadFolder({
      companyName: existingTemplate.company?.name,
      module: "sea-templates",
      subfolder: session.user.fullName,
      entityName: (updates.name as string) || existingTemplate.name || id,
    });
    
    const logoFile = fd.get("logoFile") as File | null;
    if (logoFile?.size) {
      if (existingTemplate?.logoUrl && await canDeleteFileReference(id, "logoUrl", existingTemplate.logoUrl)) {
        await deleteFile(existingTemplate.logoUrl);
      }
      updates.logoUrl = (await handleUpload(logoFile, `${templateUploadFolder}/logo`)).url;
    } else if (!fd.has("logoFile") && !fd.has("logoUrl")) {
      if (existingTemplate?.logoUrl && await canDeleteFileReference(id, "logoUrl", existingTemplate.logoUrl)) {
        await deleteFile(existingTemplate.logoUrl);
      }
      updates.logoUrl = "";
    }

    const bgFile = fd.get("letterheadBgFile") as File | null;
    if (bgFile?.size) {
      if (existingTemplate?.letterheadBgUrl && await canDeleteFileReference(id, "letterheadBgUrl", existingTemplate.letterheadBgUrl)) {
        await deleteFile(existingTemplate.letterheadBgUrl);
      }
      updates.letterheadBgUrl = (await handleUpload(bgFile, `${templateUploadFolder}/bg`)).url;
    } else if (!fd.has("letterheadBgFile") && !fd.has("letterheadBgUrl")) {
      if (existingTemplate?.letterheadBgUrl && await canDeleteFileReference(id, "letterheadBgUrl", existingTemplate.letterheadBgUrl)) {
        await deleteFile(existingTemplate.letterheadBgUrl);
      }
      updates.letterheadBgUrl = "";
    }

    const template = await SeaTemplate.findByIdAndUpdate(id, updates, { new: true })
      .populate("company", "name logo address rpslNo rpslValidity")
      .lean();

    if (!template) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: JSON.parse(JSON.stringify(template)) });
  } catch (err) {
    console.error("PATCH /api/sea-templates/[id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ success: false }, { status: 401 });

    const authz = await authorizeRequest("templates.delete");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const { id } = await params;
    
    // Find the document to check for physical files
    const existing = await SeaTemplate.findById(id).select("logoUrl letterheadBgUrl").lean() as any;
    
    if (existing) {
      // Delete associated physical files
      if (existing.logoUrl && await canDeleteFileReference(id, "logoUrl", existing.logoUrl)) {
        await deleteFile(existing.logoUrl);
      }
      if (existing.letterheadBgUrl && await canDeleteFileReference(id, "letterheadBgUrl", existing.letterheadBgUrl)) {
        await deleteFile(existing.letterheadBgUrl);
      }
      
      // Perform hard delete
      await SeaTemplate.findByIdAndDelete(id);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
