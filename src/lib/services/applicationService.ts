import { dbConnect } from "@/lib/db";
import Crew from "@/models/Application";
import Company from "@/models/Company";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";


interface GetCrewApplicationsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  rank?: string;
  nationality?: string;
  startDate?: string;
  endDate?: string;
  companyId?: string;  // ← add: explicit company filter (used by super admin)
  user: any;
}

export async function getCrewApplications({
  page = 1,
  limit = 10,
  search = "",
  status = "all",
  rank,
  nationality,
  startDate,
  endDate,
  companyId,   // ← add
  user,
}: GetCrewApplicationsParams) {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = companyId || user.company?.id;
  const skip = (page - 1) * limit;

  // Super admin with no company filter — return empty (they must pick a company)
  if (!userCompanyId && !isSuperAdmin) {
    return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
  }

  const query: any = { deletedAt: null };

  // Scope to company — super admin can see all if no companyId passed
  if (userCompanyId) {
    if (!mongoose.isValidObjectId(userCompanyId)) {
      return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
    }
    query.company = new mongoose.Types.ObjectId(userCompanyId);
  }

  if (status && status !== "all") query.status = status;
  if (rank?.trim()) query.rank = { $regex: rank.trim(), $options: "i" };
  if (nationality?.trim()) query.nationality = { $regex: nationality.trim(), $options: "i" };

  if (search.trim()) {
    const s = search.trim();
    query.$or = [
      { firstName:   { $regex: s, $options: "i" } },
      { lastName:    { $regex: s, $options: "i" } },
      { email:       { $regex: s, $options: "i" } },
      { rank:        { $regex: s, $options: "i" } },
      { nationality: { $regex: s, $options: "i" } },
    ];
  }

  if (startDate || endDate) {
    const dateQuery: any = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateQuery.$lte = end;
    }
    query.createdAt = dateQuery;
  }

  const [data, total] = await Promise.all([
    Crew.find(query)
      .select("-adminNotes -__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Crew.countDocuments(query),
  ]);

  return {
    data: JSON.parse(JSON.stringify(data)),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

// ── Dropdown helper for super admin ────────────────────────────────────────
export async function getAllCompaniesForDropdown(): Promise<{ id: string; name: string }[]> {
  await dbConnect();
  const companies = await Company.find({ deletedAt: null, status: "active" })
    .select("_id name")
    .sort({ name: 1 })
    .lean();
  return companies.map((c: any) => ({ id: c._id.toString(), name: c.name }));
}

// ── Get current user's applications (public status tab) ────────────────────
export async function getMyApplications(userId: string, companyId: string) {
  await dbConnect();

  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(companyId)) {
    return [];
  }

  const applications = await Crew.find({
    userId: new mongoose.Types.ObjectId(userId),
    company: new mongoose.Types.ObjectId(companyId),
    deletedAt: null,
  })
    .select("_id status firstName lastName rank positionApplied createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(applications));
}

// ── Get one application (for view mode — must belong to userId) ────────────
export async function getMyApplicationById(userId: string, applicationId: string) {
  await dbConnect();

  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(applicationId)) {
    return null;
  }

  const application = await Crew.findOne({
    _id: new mongoose.Types.ObjectId(applicationId),
    userId: new mongoose.Types.ObjectId(userId),
    deletedAt: null,
  }).lean();

  return application ? JSON.parse(JSON.stringify(application)) : null;
}


export async function requireCareerAuth(redirectPath: string) {
  const [, session] = await Promise.all([dbConnect(), auth()]);
  if (!session?.user) {
    redirect(`/signin?redirect=${encodeURIComponent(redirectPath)}`);
  }
  return session;
}

export async function fetchCareerCompany(
  companyId: string,
  select: string = "name logo",
) {
  if (!mongoose.isValidObjectId(companyId)) notFound();
  await dbConnect();

  const company = await Company.findOne({
    _id: companyId,
    status: "active",
    deletedAt: null,
  })
    .select(select)
    .lean<{
      _id: mongoose.Types.ObjectId;
      name: string;
      logo?: string;
    }>();

  if (!company) notFound();
  return company;
}


// ── Get ALL applications by userId across all companies ────────────────────
export async function getAllMyApplications(userId: string) {
  await dbConnect();

  if (!mongoose.isValidObjectId(userId)) return [];

  const applications = await Crew.find({
    userId: new mongoose.Types.ObjectId(userId),
    deletedAt: null,
  })
    .select("_id status firstName lastName rank positionApplied createdAt updatedAt company")
    .populate("company", "name logo")
    .sort({ updatedAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(applications));
}