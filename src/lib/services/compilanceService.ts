import { dbConnect } from "@/lib/db";
import Candidate from "@/models/Candidate";
import Crew from "@/models/Crew";
import Company from "@/models/Company";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Contract from "@/models/Contract";
import Vessel from "@/models/Vessel";

function toValidDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getLatestPassport(passports: any[] | null | undefined) {
  return (passports ?? []).reduce((latest: any | null, passport: any) => {
    const expiry = toValidDate(passport?.dateExpired);
    if (!expiry) return latest;

    const latestExpiry = toValidDate(latest?.dateExpired);
    if (!latest || !latestExpiry || expiry > latestExpiry) return passport;
    return latest;
  }, null);
}

function buildComplianceAlerts(c: any, future: Date, now: Date, expiryType: string) {
  const alerts: {
    type: string;
    label: string;
    expiry: string | null;
    issued: string | null;
    expired: boolean;
  }[] = [];

  const shouldCheck = (type: string) => expiryType === "all" || expiryType === type;

  const check = (
    type: string,
    label: string,
    dateStr: string | Date | null | undefined,
    issuedDate?: string | Date | null
  ) => {
    if (!shouldCheck(type)) return;
    const d = toValidDate(dateStr);
    if (!d || d > future) return;

    alerts.push({
      type,
      label,
      expiry: typeof dateStr === "string" ? dateStr : d.toISOString(),
      issued: issuedDate ? (typeof issuedDate === "string" ? issuedDate : issuedDate.toISOString()) : null,
      expired: d < now,
    });
  };

  check("medical", "Medical Cert", c.medicalCertExpiredDate, c.medicalCertIssuedDate);

  const latestPassport = getLatestPassport(c.passports);
  if (latestPassport) {
    check("passport", `Passport ${latestPassport.number || ""}`.trim(), latestPassport.dateExpired);
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

  return alerts;
}


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

  const data = await Candidate.find(query)
    .select(
      "firstName lastName rank nationality profilePhoto crew status email cellPhone " +
      "medicalCertIssuedDate medicalCertExpiredDate passports licences seamansBooks stcwCertificates endorsements company"
    )
    .populate("company", "name")
    .sort({ medicalCertExpiredDate: 1 })
    .lean();

  const serialized = JSON.parse(JSON.stringify(data));

  // Tag each crew with which docs are expiring/expired
  const tagged = serialized.map((c: any) => {
    const alerts = buildComplianceAlerts(c, future, now, expiryType);
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
  }).filter((c: any) => c.alertCount > 0);

  tagged.sort((a: any, b: any) => {
    const aTime = Math.min(...a.alerts.map((alert: any) => new Date(alert.expiry).getTime()));
    const bTime = Math.min(...b.alerts.map((alert: any) => new Date(alert.expiry).getTime()));
    return aTime - bTime;
  });

  const total = tagged.length;
  const paged = tagged.slice(skip, skip + limit);

  return {
    data: paged,
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

  const candidates = await Candidate.find(query)
    .select(
      "medicalCertIssuedDate medicalCertExpiredDate passports licences seamansBooks stcwCertificates endorsements"
    )
    .lean();

  return candidates.filter((candidate) => buildComplianceAlerts(candidate, future, now, "all").length > 0).length;
}
