
import { dbConnect } from "@/lib/db";
import Crew from "@/models/Application";
import mongoose from "mongoose";

interface GetCrewApplicationsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  rank?: string;
  nationality?: string;
  startDate?: string;
  endDate?: string;
  user: any; // Session user
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
  user,
}: GetCrewApplicationsParams) {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = user.company?.id;
  const skip = (page - 1) * limit;

  // ── 1. Authorization & Scoping ──────────────────────────────────────────
  if (!userCompanyId && !isSuperAdmin) {
    return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
  }

  if (!userCompanyId) {
    return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
  }

  if (!mongoose.isValidObjectId(userCompanyId)) {
    return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
  }

  const query: any = {
    company:   new mongoose.Types.ObjectId(userCompanyId),
    deletedAt: null,
  };

  // ── 2. Status Filter ────────────────────────────────────────────────────
  if (status && status !== "all") {
    query.status = status;
  }

  // ── 3. Rank Filter ──────────────────────────────────────────────────────
  if (rank?.trim()) {
    query.rank = { $regex: rank.trim(), $options: "i" };
  }

  // ── 4. Nationality Filter ───────────────────────────────────────────────
  if (nationality?.trim()) {
    query.nationality = { $regex: nationality.trim(), $options: "i" };
  }

  // ── 5. Search Filter ────────────────────────────────────────────────────
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

  // ── 6. Date Filter ──────────────────────────────────────────────────────
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

  // ── 7. Execute ──────────────────────────────────────────────────────────
  const [data, total] = await Promise.all([
    Crew.find(query)
      .select("-adminNotes -__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Crew.countDocuments(query),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // ── 8. Serialize & Return ───────────────────────────────────────────────
  return {
    data: JSON.parse(JSON.stringify(data)),
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}