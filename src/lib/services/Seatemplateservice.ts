// src/lib/services/seaTemplateService.ts
import { dbConnect } from "@/lib/db";
import SeaTemplate from "@/models/Seatemplate";
import Company from "@/models/Company";
import mongoose from "mongoose";

// ── List templates for a company ────────────────────────────────────────────
export async function getSeaTemplates(
  companyId: string,
  userId: string,
  role: string,
  page = 1,
  limit = 10,
  filters?: {
    search?: string;
    status?: string;
    companyId?: string;
  }
) {
  await dbConnect();
  const isSuperAdmin = role?.toLowerCase() === "super-admin";

  const query: any = { deletedAt: null };
  
  // Apply filters
  if (filters?.status && filters.status !== "all") {
    query.status = filters.status;
  }
  
  if (filters?.search) {
    query.name = { $regex: filters.search, $options: "i" };
  }

  // Company filter - super admin can see all, regular users see only their company
  if (isSuperAdmin && filters?.companyId) {
    query.company = new mongoose.Types.ObjectId(filters.companyId);
  } else if (!isSuperAdmin) {
    if (!mongoose.isValidObjectId(companyId)) return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    query.company = new mongoose.Types.ObjectId(companyId);
  }

  const skip  = (page - 1) * limit;
  const total = await SeaTemplate.countDocuments(query);

  const templates = await SeaTemplate.find(query)
    .populate("company", "name logo")
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    data: JSON.parse(JSON.stringify(templates)),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ── Get single template ──────────────────────────────────────────────────────
export async function getSeaTemplateById(templateId: string) {
  await dbConnect();
  if (!mongoose.isValidObjectId(templateId)) return null;

  const template = await SeaTemplate.findOne({
    _id: templateId,
    deletedAt: null,
  })
    .populate("company", "name logo address currency")
    .lean();

  return template ? JSON.parse(JSON.stringify(template)) : null;
}

// ── Get companies for dropdown (super admin) ────────────────────────────────
export async function getAllCompaniesForTemplatePage(): Promise<{ id: string; name: string; logo?: string }[]> {
  await dbConnect();
  const companies = await Company.find({ deletedAt: null, status: "active" })
    .select("_id name logo")
    .sort({ name: 1 })
    .lean();
  return (companies as any[]).map((c) => ({
    id: c._id.toString(),
    name: c.name,
    logo: c.logo,
  }));
}

// ── Delete template (soft) ───────────────────────────────────────────────────
export async function deleteSeaTemplate(templateId: string) {
  await dbConnect();
  if (!mongoose.isValidObjectId(templateId)) return false;
  await SeaTemplate.findByIdAndUpdate(templateId, { deletedAt: new Date() });
  return true;
}
