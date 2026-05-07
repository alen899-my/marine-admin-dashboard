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
import { pickLatestWage } from "@/lib/wageHistory";
import { getCompanyCurrency } from "@/lib/services/companyService";
import { getSettings } from "@/lib/systemSettings.server";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CrewDetailsPageClient, {
  CrewDetailsData,
} from "./CrewDetailsPageClient";

export const metadata: Metadata = {
  title: "Crew Details | Parkora Falcon",
  description: "View crew profile, contract, and onboarding details.",
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}

const VALID_TABS = new Set(["crew", "contract", "payscale", "onboarding", "leave-settings"]);

export default async function CrewViewPage({
  params,
  searchParams,
}: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const authz = await authorizeRequest("crews.view");
  if (!authz.ok) redirect("/403");

  const user = session.user;

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
    .select("-adminNotes -__v")
    .populate("company", "name")
    .populate("jobId", "title description")
    .lean();

  if (!rawCrew) notFound();

  const serializedCrew = JSON.parse(JSON.stringify(rawCrew));

  const latestContract = await Contract.findOne({
    applicationId: new mongoose.Types.ObjectId(id),
    deletedAt: null,
  })
    .populate("vesselId", "name _id flag imo")
    .sort({ createdAt: -1 })
    .lean();

  const wageHistory = latestContract
    ? await Wage.find({
        contractId: latestContract._id,
        deletedAt: null,
      })
        .sort({ effectiveFrom: -1, createdAt: -1 })
        .lean()
    : [];
  const latestWage = pickLatestWage(wageHistory);

  // Load Crew document for status and onboarding details
  const crewDoc = await Crew.findOne({
    applicationId: new mongoose.Types.ObjectId(id),
    deletedAt: null,
  }).lean();
  const crewDocSerialized = crewDoc ? JSON.parse(JSON.stringify(crewDoc)) : null;

  const crew: CrewDetailsData = {
    ...serializedCrew,
    positionApplied:
      serializedCrew.jobId?.title ?? serializedCrew.positionApplied ?? "",
    companyName: serializedCrew.company?.name ?? "",
    company: serializedCrew.company?._id ?? serializedCrew.company ?? "",
    jobTitle: serializedCrew.jobId?.title ?? serializedCrew.jobTitle ?? null,
    jobId: serializedCrew.jobId?._id ?? serializedCrew.jobId ?? null,
    // Crew document fields (source of truth)
    crewId: crewDocSerialized ? String(crewDocSerialized._id) : null,
    crew: crewDocSerialized?.crewStatus ?? serializedCrew.crew ?? "inactive",
    crewStatus: crewDocSerialized?.crewStatus ?? serializedCrew.crew ?? "inactive",
    onboardDate: crewDocSerialized?.onboardDate ?? serializedCrew.onboardDate ?? null,
    onboardPort: crewDocSerialized?.onboardPort ?? serializedCrew.onboardPort ?? null,
    contractStart: crewDocSerialized?.contractStart ?? serializedCrew.contractStart ?? null,
    contractEnd: crewDocSerialized?.contractEnd ?? serializedCrew.contractEnd ?? null,
    contractPeriod: crewDocSerialized?.contractPeriod ?? serializedCrew.contractPeriod ?? null,
    onboardingChecklist: crewDocSerialized?.onboardingChecklist ?? serializedCrew.onboardingChecklist ?? [],
    leaveLimits: crewDocSerialized?.leaveLimits ?? serializedCrew.leaveLimits ?? [],
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

  const companyId =
    typeof crew.company === "string"
      ? crew.company
      : crew.company
        ? String(crew.company)
        : "";

  const resolvedSearchParams = (await searchParams) ?? {};
  const tabParam = resolvedSearchParams.tab;
  const initialTab =
    tabParam && VALID_TABS.has(tabParam)
      ? (tabParam as "crew" | "contract" | "payscale" | "onboarding" | "leave-settings")
      : "crew";

  const displayName =
    `${crew.firstName || ""} ${crew.lastName || ""}`.trim() || "Crew Details";

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

      <CrewDetailsPageClient
        crew={crew}
        companyId={companyId}
        initialTab={initialTab}
        currencyCode={currencyCode}
        currencySettings={currencySettings}
      />
    </div>
  );
}
