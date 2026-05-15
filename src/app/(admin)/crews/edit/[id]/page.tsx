import { Metadata } from "next";
import mongoose from "mongoose";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import Candidate from "@/models/Candidate";
import Contract from "@/models/Contract";
import Crew from "@/models/Crew";
import "@/models/Job";
import Wage from "@/models/Wage";
import Company from "@/models/Company";
import { pickLatestWage } from "@/lib/wageHistory";
import { getCompanyCurrency } from "@/lib/services/companyService";
import { getSettings } from "@/lib/systemSettings.server";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { fetchActiveJobPositions } from "@/lib/services/applicationService";
import { getVesselOptionsForDropdown } from "@/lib/services/vessels";
import CrewEditPageClient from "./CrewEditPageClient";

export const metadata: Metadata = {
  title: "Edit Crew | Parkora Falcon",
  description: "Edit crew, contract, and onboarding details.",
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}

const VALID_TABS = new Set(["crew", "contract", "payscale", "onboarding", "leave-settings"]);

export default async function CrewEditPage({
  params,
  searchParams,
}: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const authz = await authorizeRequest(["crews.edit", "candidates.edit"]);
  if (!authz.ok) redirect("/403");

  const user = session.user;
  const permissions = user.permissions || [];

  const canEditCandidate =
    permissions.includes("crews.edit") ||
    permissions.includes("candidates.edit");
  const canEditContract = permissions.includes("contracts.edit");
  const canManageOnboarding =
    permissions.includes("onboarding.view") ||
    permissions.includes("onboarding.edit") ||
    permissions.includes("onboarding.confirm") ||
    permissions.includes("onboarding.checklistadding") ||
    permissions.includes("onboarding.delete");

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return (
      <div className="p-8 text-center text-red-500 font-medium">
        Invalid crew ID.
      </div>
    );
  }

  const isSuperAdmin =
    user.role?.toLowerCase() === "super-admin" ||
    user.role?.toLowerCase() === "super_admin";

  await dbConnect();

  const query: Record<string, unknown> = {
    _id: new mongoose.Types.ObjectId(id),
    deletedAt: null,
    crew: { $in: ["onboard", "vacation", "available", "traveling", "medical_leave", "training", "inactive", "resigned", "blacklisted"] },
  };

  if (!isSuperAdmin) {
    const companyId = user.company?.id;
    if (!companyId || !mongoose.isValidObjectId(companyId)) {
      return (
        <div className="p-8 text-center text-amber-600 bg-amber-50 rounded-lg border border-amber-200">
          Account Error: Your user profile is not linked to a company. Please
          contact system administration.
        </div>
      );
    }

    query.company = new mongoose.Types.ObjectId(companyId);
  }

  const rawCrew = await Candidate.findOne(query)
    .populate("jobId", "title")
    .select("-adminNotes -__v")
    .lean();
  if (!rawCrew) notFound();

  const crew = JSON.parse(JSON.stringify(rawCrew));
  if (crew.jobId && typeof crew.jobId === "object") {
    crew.positionApplied = crew.jobId.title || crew.positionApplied || "";
    crew.jobId = crew.jobId._id;
  }

  const crewDoc = await Crew.findOne({
    applicationId: new mongoose.Types.ObjectId(id),
    deletedAt: null,
  }).lean();

  const companyId =
    typeof crew.company === "string"
      ? crew.company
      : (crew.company?.$oid ?? String(crew.company));

  const [company, activePositions, latestContract, vesselOptions] =
    await Promise.all([
      Company.findById(companyId).select("name logo").lean(),
      fetchActiveJobPositions(companyId),
      Contract.findOne({
        applicationId: new mongoose.Types.ObjectId(id),
        deletedAt: null,
      })
        .populate("vesselId", "name _id flag imo")
        .sort({ createdAt: -1 })
        .lean(),
      getVesselOptionsForDropdown(companyId),
    ]);

  const wageHistory = latestContract
    ? await Wage.find({
        contractId: latestContract._id,
        deletedAt: null,
      })
        .sort({ effectiveFrom: -1, createdAt: -1 })
        .lean()
    : [];
  const latestWage = pickLatestWage(wageHistory);

  const companyData = company ? JSON.parse(JSON.stringify(company)) : null;

  const availablePositions = [...activePositions];
  if (crew.jobId && crew.positionApplied) {
    const jobIdStr = crew.jobId.toString();
    const exists = availablePositions.some((p) => p.value === jobIdStr);
    if (!exists) {
      availablePositions.push({
        value: jobIdStr,
        label: crew.positionApplied,
      });
    }
  }

  let companiesProp: { value: string; label: string }[] = [];
  if (isSuperAdmin) {
    const allCompanies = await Company.find({ deletedAt: null })
      .select("name")
      .sort({ name: 1 })
      .lean();
    companiesProp = (allCompanies as any[]).map((item) => ({
      value: item._id.toString(),
      label: item.name,
    }));
  }

  // Merge Crew document fields (source of truth) with Candidate fields (fallback)
  const crewDocSerialized = crewDoc ? JSON.parse(JSON.stringify(crewDoc)) : null;

  const toDateString = (date: Date | string | null | undefined): string => {
    if (!date) return "";
    if (typeof date === "string") return date;
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
    return "";
  };

  const enrichedCrew = {
    ...crew,
    companyName: companyData?.name ?? "",
    // Crew document fields (preferred over Candidate)
    crewId: crewDocSerialized ? String(crewDocSerialized._id) : null,
    crew: crewDocSerialized?.crewStatus ?? crew.crew ?? "inactive",
    crewStatus: crewDocSerialized?.crewStatus ?? crew.crew ?? "inactive",
    // Onboarding fields from Contract
    onboardDate: toDateString(latestContract?.onboardDate ?? crew.onboardDate ?? null),
    onboardPort: latestContract?.portOfJoining ?? crew.onboardPort ?? null,
    contractStart: toDateString(latestContract?.contractStart ?? crew.contractStart ?? null),
    contractEnd: toDateString(latestContract?.contractEnd ?? crew.contractEnd ?? null),
    contractPeriod: latestContract?.contractPeriod ?? crew.contractPeriod ?? null,
    onboardingChecklist: crewDocSerialized?.onboardingChecklist ?? crew.onboardingChecklist ?? [],
    leaveLimits: crewDocSerialized?.leaveLimits ?? crew.leaveLimits ?? [],
    contractRaw: latestContract
      ? JSON.parse(
          JSON.stringify({
            ...latestContract,
            wages: latestWage,
            wagesHistory: wageHistory,
          }),
        )
      : null,
  };

  const resolvedSearchParams = (await searchParams) ?? {};
  const tabParam = resolvedSearchParams.tab;
  const initialTab =
    tabParam && VALID_TABS.has(tabParam)
      ? (tabParam as "crew" | "contract" | "payscale" | "onboarding" | "leave-settings")
      : "crew";

  const displayName =
    `${enrichedCrew.firstName || ""} ${enrichedCrew.lastName || ""}`.trim() ||
    "Edit Crew";

  // Get company currency
  let currencyCode = "USD";
  let currencySettings = await getSettings(
    companyId ? { companyId } : undefined,
  );
  if (companyId) {
    try {
      currencyCode = await getCompanyCurrency(companyId);
      currencySettings = await getSettings({ companyId });
    } catch {
      // Default to USD on error
    }
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb
        pageTitle={displayName}
        items={[{ label: "Crews", href: "/crews" }]}
      />

      <CrewEditPageClient
        crew={enrichedCrew}
        companyId={companyId}
        companyName={companyData?.name}
        companyLogo={companyData?.logo}
        availablePositions={availablePositions}
        vesselOptions={vesselOptions}
        jobId={crew.jobId?.toString()}
        isSuperAdmin={isSuperAdmin}
        companies={companiesProp}
        initialTab={initialTab}
        canEditCandidate={canEditCandidate}
        canEditContract={canEditContract}
        canManageOnboarding={canManageOnboarding}
        currencyCode={currencyCode}
        currencySettings={currencySettings}
      />
    </div>
  );
}
