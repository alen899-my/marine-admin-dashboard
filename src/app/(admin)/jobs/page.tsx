import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Crew from "@/models/Application";
import Company from "@/models/Company";
import JobPageClient from "./JobPageClient";
import JobTable from "./JobTable";
import { Metadata } from "next";
import mongoose from "mongoose";

export const metadata: Metadata = {
  title: "Crew Management | Parkora Falcon",
  description: "Manage crew applications, CVs, and recruitment workflow.",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function JobManagement({ searchParams }: PageProps) {
  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user) {
    return <div className="p-8 text-center font-medium">Unauthorized Access</div>;
  }

  const user = session.user;
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";

  // ── 2. Resolve company ID ────────────────────────────────────────────────
  const resolvedParams = await searchParams;
  const sessionCompanyId = user.company?.id;

  const targetCompanyId =
    isSuperAdmin && resolvedParams.companyId
      ? resolvedParams.companyId
      : sessionCompanyId;

  if (!targetCompanyId) {
    return (
      <div className="p-8 text-center text-amber-600 bg-amber-50 rounded-lg border border-amber-200">
        Account Error: Your user profile is not linked to a company. Please contact system
        administration.
      </div>
    );
  }

  if (!mongoose.isValidObjectId(targetCompanyId)) {
    return (
      <div className="p-8 text-center text-red-500 font-medium">
        Invalid company ID.
      </div>
    );
  }

  // ── 3. Fetch data ────────────────────────────────────────────────────────
  const currentPage = Math.max(1, Number(resolvedParams.page) || 1);
  const limit = 10;
  const skip = (currentPage - 1) * limit;

  const companyObjId = new mongoose.Types.ObjectId(targetCompanyId);

  // Build filter
  const filter: Record<string, unknown> = {
    company: companyObjId,
    deletedAt: null,
  };

  if (resolvedParams.status && resolvedParams.status !== "all") {
    filter.status = resolvedParams.status;
  }

  if (resolvedParams.search?.trim()) {
    const s = resolvedParams.search.trim();
    filter.$or = [
      { firstName: { $regex: s, $options: "i" } },
      { lastName: { $regex: s, $options: "i" } },
      { email: { $regex: s, $options: "i" } },
      { rank: { $regex: s, $options: "i" } },
      { nationality: { $regex: s, $options: "i" } },
    ];
  }

  if (resolvedParams.startDate || resolvedParams.endDate) {
    const dateQuery: any = {};
    if (resolvedParams.startDate) {
      dateQuery.$gte = new Date(resolvedParams.startDate);
    }
    if (resolvedParams.endDate) {
      const endOfDay = new Date(resolvedParams.endDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      dateQuery.$lte = endOfDay;
    }
    filter.createdAt = dateQuery;
  }

  try {
    await dbConnect();

    const [total, applicationsRaw, companiesRaw] = await Promise.all([
      Crew.countDocuments(filter),

      Crew.find(filter)
        .select("-adminNotes -__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      isSuperAdmin
        ? Company.find({ deletedAt: null })
          .select("_id name")
          .sort({ name: 1 })
          .lean()
        : Promise.resolve([]),
    ]);

    // Serialize: converts all ObjectIds, Dates, and Buffers to plain JSON-safe values
    const applications = JSON.parse(JSON.stringify(applicationsRaw));
    const companies = JSON.parse(JSON.stringify(companiesRaw));

    const companyOptions = (companies as { _id: string; name: string }[]).map(
      (c) => ({ id: c._id, name: c.name })
    );

    // ── 4. Render ──────────────────────────────────────────────────────────
    return (
      <JobPageClient
        totalCount={total}
        companies={companyOptions}
        isSuperAdmin={isSuperAdmin}
        canAdd={true}
      >
        <JobTable
          data={applications}
          pagination={{
            page: currentPage,
            limit: limit,
            total: total,
            totalPages: Math.ceil(total / limit),
          }}
        />
      </JobPageClient>
    );
  } catch (error) {
    console.error("JOB MANAGEMENT PAGE ERROR →", error);
    return (
      <div className="p-8 text-center text-red-500 font-medium">
        Error loading applications. Please try again later.
      </div>
    );
  }
}