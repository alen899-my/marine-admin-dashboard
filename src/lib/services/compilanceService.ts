import { dbConnect } from "@/lib/db";
import Candidate from "@/models/Candidate";
import Crew from "@/models/Crew";
import Company from "@/models/Company";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Contract from "@/models/Contract";
import Vessel from "@/models/Vessel";


export async function getComplianceExpiryCrews({
  page = 1,
  limit = 10,
  search = "",
  expiryType = "all", // "coc" | "stcw" | "medical" | "passport" | "all"
  daysAhead = 90,     // show expiring within N days
  companyId,
  user,
}: {
  page?: number;
  limit?: number;
  search?: string;
  expiryType?: string;
  daysAhead?: number;
  companyId?: string;
  user: any;
}) {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = companyId || user.company?.id;
  const skip = (page - 1) * limit;

  if (!userCompanyId && !isSuperAdmin) {
    return { data: [], pagination: { total: 0, page, limit, totalPages: 0 } };
  }

  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + daysAhead);

  // ── Get active crew applicationIds from the Crew collection
  const crewQuery: any = {
    crewStatus: { $in: ["onboard", "vacation", "available", "traveling", "medical_leave", "training"] },
    deletedAt: null,
  };
  if (userCompanyId && mongoose.isValidObjectId(userCompanyId)) {
    if (!isSuperAdmin || companyId) {
      crewQuery.company = new mongoose.Types.ObjectId(userCompanyId);
    }
  }
  const activeCrewAppIds = await Crew.find(crewQuery).distinct("applicationId").lean();

  // Base query — only active crew, not deleted
  const query: any = {
    deletedAt: null,
    _id: { $in: activeCrewAppIds },
  };

  // Search
  if (search.trim()) {
    const s = search.trim();
    query.$or = [
      { firstName: { $regex: s, $options: "i" } },
      { lastName: { $regex: s, $options: "i" } },
      { rank: { $regex: s, $options: "i" } },
      { nationality: { $regex: s, $options: "i" } },
    ];
  }

  // Expiry window condition — past or within daysAhead
  const expiryWindow = { $lte: future };

  // Build expiry filter depending on type
  const expiryConditions: any[] = [];

  if (expiryType === "all" || expiryType === "medical") {
    expiryConditions.push({ medicalCertExpiredDate: expiryWindow });
  }
  if (expiryType === "all" || expiryType === "passport") {
    expiryConditions.push({ "passports.dateExpired": expiryWindow });
  }
  if (expiryType === "all" || expiryType === "coc") {
    expiryConditions.push({
      licences: {
        $elemMatch: {
          licenceType: "coc",
          dateExpired: expiryWindow,
        },
      },
    });
  }
  if (expiryType === "all" || expiryType === "coe") {
    expiryConditions.push({
      licences: {
        $elemMatch: {
          licenceType: "coe",
          dateExpired: expiryWindow,
        },
      },
    });
  }
  if (expiryType === "all" || expiryType === "stcw") {
    expiryConditions.push({ "stcwCertificates.dateExpired": expiryWindow });
  }
  if (expiryType === "all" || expiryType === "seaman") {
    expiryConditions.push({ "seamansBooks.dateExpired": expiryWindow });
  }
  if (expiryType === "all" || expiryType === "endorsement") {
    expiryConditions.push({ "endorsements.dateExpired": expiryWindow });
  }

  // Merge expiry $or with existing $or (search)
  if (expiryConditions.length > 0) {
    if (query.$or) {
      // search $or already exists — wrap both in $and
      query.$and = [
        { $or: query.$or },
        { $or: expiryConditions },
      ];
      delete query.$or;
    } else {
      query.$or = expiryConditions;
    }
  }

  const [data, total] = await Promise.all([
    Candidate.find(query)
      .select(
        "firstName lastName rank nationality profilePhoto crew status email cellPhone " +
        "medicalCertExpiredDate passports licences seamansBooks stcwCertificates endorsements company"
      )
      .populate("company", "name")
      .sort({ medicalCertExpiredDate: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Candidate.countDocuments(query),
  ]);

  const serialized = JSON.parse(JSON.stringify(data));

  // Tag each crew with which docs are expiring/expired
  const tagged = serialized.map((c: any) => {
    const alerts: {
      type: string;
      label: string;
      expiry: string | null;
      issued: string | null;
      expired: boolean;
    }[] = [];

    const check = (type: string, label: string, dateStr: string | null | undefined, issuedDate?: string | null) => {
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (d <= future) {
        alerts.push({ type, label, expiry: dateStr, issued: issuedDate || null, expired: d < now });
      }
    };

    check("medical", "Medical Cert", c.medicalCertExpiredDate, c.medicalCertIssuedDate);

    for (const p of c.passports ?? []) {
      check("passport", `Passport ${p.number || ""}`.trim(), p.dateExpired);
    }
    for (const l of c.licences ?? []) {
      if (l.licenceType === "coc") {
        const label = `CoC ${l.grade || ""}`.trim();
        check("coc", label, l.dateExpired);
      }
    }
    for (const sb of c.seamansBooks ?? []) {
      check("seaman", `CDC/Seaman Book ${sb.number || ""}`.trim(), sb.dateExpired);
    }
    for (const s of c.stcwCertificates ?? []) {
      check("stcw", s.name || "STCW Cert", s.dateExpired);
    }

    return {
      _id: c._id,
      firstName: c.firstName,
      lastName: c.lastName,
      rank: c.rank,
      nationality: c.nationality,
      profilePhoto: c.profilePhoto ?? null,
      crew: c.crew,
      status: c.status,
      email: c.email ?? "",
      cellPhone: c.cellPhone ?? "",
      companyName: c.company?.name ?? "",
      company: c.company?._id ?? c.company,
      alerts,
      hasExpired: alerts.some((a) => a.expired),
      alertCount: alerts.length,
    };
  });

  return {
    data: tagged,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getComplianceExpiryCount({
  daysAhead = 90,
  companyId,
  user,
}: {
  daysAhead?: number;
  companyId?: string;
  user: any;
}) {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = companyId || user.company?.id;

  if (!userCompanyId && !isSuperAdmin) {
    return 0;
  }

  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + daysAhead);

  // ── Get active crew applicationIds from the Crew collection
  const crewQuery2: any = {
    crewStatus: { $in: ["onboard", "vacation", "available", "traveling", "medical_leave", "training"] },
    deletedAt: null,
  };
  if (userCompanyId && mongoose.isValidObjectId(userCompanyId)) {
    if (!isSuperAdmin || companyId) {
      crewQuery2.company = new mongoose.Types.ObjectId(userCompanyId);
    }
  }
  const activeCrewAppIds2 = await Crew.find(crewQuery2).distinct("applicationId").lean();

  const query: any = {
    deletedAt: null,
    _id: { $in: activeCrewAppIds2 },
  };

  const expiryWindow = { $lte: future };

  const expiryConditions: any[] = [
    { medicalCertExpiredDate: expiryWindow },
    { "passports.dateExpired": expiryWindow },
    { "licences.dateExpired": expiryWindow },
    { "seamansBooks.dateExpired": expiryWindow },
    { "stcwCertificates.dateExpired": expiryWindow },
    { "endorsements.dateExpired": expiryWindow },
  ];

  if (expiryConditions.length > 0) {
    if (query.$or) {
      query.$and = [
        { $or: query.$or },
        { $or: expiryConditions },
      ];
      delete query.$or;
    } else {
      query.$or = expiryConditions;
    }
  }

  return await Candidate.countDocuments(query);
}