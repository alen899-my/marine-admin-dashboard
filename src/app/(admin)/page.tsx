import { Suspense } from "react";
import { auth } from "@/auth";
import CompanyFilter from "@/components/dashboard/CompanyFilter";
import EditDashboardButton from "@/components/dashboard/EditDashboardButton";
import { dbConnect } from "@/lib/db";
import { getDashboardMetrics } from "@/lib/services/dashboard";
import { getCrewStatusMetrics } from "@/lib/services/crew-status";
import { getRecruitmentMetrics } from "@/lib/services/recruitment";
import FleetOverview from "@/components/dashboard/FleetOverview";
import CrewStatusOverview from "@/components/dashboard/CrewStatusOverview";
import CrewStatusSkeleton from "@/components/dashboard/CrewStatusSkeleton";
import RecruitmentOverview from "@/components/dashboard/RecruitmentOverview";
import RecruitmentSkeleton from "@/components/dashboard/RecruitmentSkeleton";
import { getPayrollDashboardMetrics } from "@/lib/services/payroll-dashboard";
import PayrollOverview from "@/components/dashboard/PayrollOverview";
import PayrollSkeleton from "@/components/dashboard/PayrollSkeleton";
import { getDocumentExpiryAlerts } from "@/lib/services/document-expiry";
import ExpiryAlerts from "@/components/dashboard/ExpiryAlerts";
import ExpirySkeleton from "@/components/dashboard/ExpirySkeleton";
import { getVoyageOpsMetrics } from "@/lib/services/voyage-ops";
import VoyageOpsOverview from "@/components/dashboard/VoyageOpsOverview";
import VoyageOpsSkeleton from "@/components/dashboard/VoyageOpsSkeleton";
import { getContractTimelineMetrics } from "@/lib/services/contract-timeline";
import ContractTimelineOverview from "@/components/dashboard/ContractTimelineOverview";
import ContractTimelineSkeleton from "@/components/dashboard/ContractTimelineSkeleton";
import { getUserAccessMetrics } from "@/lib/services/user-access";
import UserAccessOverview from "@/components/dashboard/UserAccessOverview";
import UserAccessSkeleton from "@/components/dashboard/UserAccessSkeleton";
import { getSalaryInsightsMetrics } from "@/lib/services/salary-insights";
import SalaryInsightsOverview from "@/components/dashboard/SalaryInsightsOverview";
import SalaryInsightsSkeleton from "@/components/dashboard/SalaryInsightsSkeleton";
import { DashboardLayoutProvider } from "@/components/dashboard/DashboardLayoutContext";
import { getDashboardLayout } from "@/lib/services/dashboard-layout.server";
import Company from "@/models/Company";
import { getSettings } from "@/lib/systemSettings.server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard | Parkora Falcon",
  description: "Professional Dashboard for Parkora Falcon Maritime Operations.",
};

// Shared prop types
type DashboardMetrics = Awaited<ReturnType<typeof getDashboardMetrics>>;
type CurrencySettings = {
  currencySymbol: string;
  currencyCode: string;
  currencyPosition: "left" | "right";
  currencyFormatType: "symbol" | "code";
  currencySpace: boolean;
};

async function getCompanyOptions() {
  await dbConnect();
  const companies = await Company.find({ status: "active", deletedAt: null })
    .select("_id name")
    .lean();

  const formatted = companies.map((c: any) => ({
    value: c._id.toString(),
    label: c.name,
  }));

  return [{ value: "", label: "All Companies" }, ...formatted];
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) return <div>Unauthorized</div>;

  const userRole = session.user.role?.toLowerCase();
  if (userRole === "candidate") {
    redirect("/careers");
  }

  const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
  const resolvedSearchParams = await searchParams;
  const selectedCompanyId = (resolvedSearchParams?.companyId as string) || "";

  const sectionOrder = [
    "fleet-overview",
    "crew-status-overview",
    "recruitment-overview",
    "payroll-overview",
    "expiry-alerts",
    "voyage-ops-overview",
    "contract-timeline-overview",
    "user-access-overview",
    "salary-insights-overview",
  ];

  // ── Fetch all page-level data in parallel — ONE database round-trip batch ──
  const [metrics, settings, savedLayout, companyOptions] = await Promise.all([
    getDashboardMetrics(session.user, selectedCompanyId),
    getSettings(selectedCompanyId ? { companyId: selectedCompanyId } : undefined),
    session.user.id
      ? getDashboardLayout(session.user.id).catch(() => null)
      : Promise.resolve(null),
    isSuperAdmin ? getCompanyOptions() : Promise.resolve([]),
  ]);

  const currencySettings: CurrencySettings = {
    currencySymbol: settings.currencySymbol,
    currencyCode: settings.currencyCode,
    currencyPosition: (settings.currencyPosition as "left" | "right") || "left",
    currencyFormatType: (settings.currencyFormatType as "symbol" | "code") || "symbol",
    currencySpace: settings.currencySpace,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
        {isSuperAdmin && <CompanyFilter options={companyOptions} />}
      </div>

      <DashboardLayoutProvider defaultOrder={sectionOrder} initialLayout={savedLayout}>
        <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
          <EditDashboardButton />
        </div>
        <div className="flex flex-col gap-6">
          <Suspense fallback={<CrewStatusSkeleton />}>
            <FleetLoader user={session.user} companyId={selectedCompanyId} metrics={metrics} />
          </Suspense>

          <Suspense fallback={<RecruitmentSkeleton />}>
            <RecruitmentLoader user={session.user} companyId={selectedCompanyId} metrics={metrics} />
          </Suspense>

          {!(isSuperAdmin && !selectedCompanyId) && (
            <Suspense fallback={<PayrollSkeleton />}>
              <PayrollLoader
                user={session.user}
                companyId={selectedCompanyId}
                metrics={metrics}
                currencySettings={currencySettings}
              />
            </Suspense>
          )}

          <Suspense fallback={<ExpirySkeleton />}>
            <ExpiryLoader user={session.user} companyId={selectedCompanyId} />
          </Suspense>

          <Suspense fallback={<VoyageOpsSkeleton />}>
            <VoyageOpsLoader user={session.user} companyId={selectedCompanyId} metrics={metrics} />
          </Suspense>

          <Suspense fallback={<ContractTimelineSkeleton />}>
            <ContractTimelineLoader user={session.user} companyId={selectedCompanyId} metrics={metrics} />
          </Suspense>

          <Suspense fallback={<UserAccessSkeleton />}>
            <UserAccessLoader user={session.user} companyId={selectedCompanyId} metrics={metrics} />
          </Suspense>

          {!(isSuperAdmin && !selectedCompanyId) && (
            <Suspense fallback={<SalaryInsightsSkeleton />}>
              <SalaryInsightsLoader
                user={session.user}
                companyId={selectedCompanyId}
                currencySettings={currencySettings}
              />
            </Suspense>
          )}
        </div>
      </DashboardLayoutProvider>
    </div>
  );
}

// ── Loader components — each only fetches its own unique data ─────────────────

async function FleetLoader({
  user,
  companyId,
  metrics,
}: {
  user: any;
  companyId: string;
  metrics: DashboardMetrics;
}) {
  const crewStatusData = await getCrewStatusMetrics(user, companyId);
  return (
    <>
      <FleetOverview metrics={metrics} />
      <CrewStatusOverview data={crewStatusData} />
    </>
  );
}

async function RecruitmentLoader({
  user,
  companyId,
  metrics,
}: {
  user: any;
  companyId: string;
  metrics: DashboardMetrics;
}) {
  const data = await getRecruitmentMetrics(user, companyId);
  return <RecruitmentOverview data={data} metrics={metrics} />;
}

async function PayrollLoader({
  user,
  companyId,
  metrics,
  currencySettings,
}: {
  user: any;
  companyId: string;
  metrics: DashboardMetrics;
  currencySettings: CurrencySettings;
}) {
  const data = await getPayrollDashboardMetrics(user, companyId);
  return <PayrollOverview data={data} metrics={metrics} currencySettings={currencySettings} />;
}

async function ExpiryLoader({ user, companyId }: { user: any; companyId: string }) {
  const data = await getDocumentExpiryAlerts(user, companyId);
  return <ExpiryAlerts data={data} />;
}

async function VoyageOpsLoader({
  user,
  companyId,
  metrics,
}: {
  user: any;
  companyId: string;
  metrics: DashboardMetrics;
}) {
  const data = await getVoyageOpsMetrics(user, companyId);
  return <VoyageOpsOverview data={data} metrics={metrics} />;
}

async function ContractTimelineLoader({
  user,
  companyId,
  metrics,
}: {
  user: any;
  companyId: string;
  metrics: DashboardMetrics;
}) {
  const data = await getContractTimelineMetrics(user, companyId);
  return <ContractTimelineOverview data={data} metrics={metrics} />;
}

async function UserAccessLoader({
  user,
  companyId,
  metrics,
}: {
  user: any;
  companyId: string;
  metrics: DashboardMetrics;
}) {
  const data = await getUserAccessMetrics(user, companyId);
  return <UserAccessOverview data={data} metrics={metrics} />;
}

async function SalaryInsightsLoader({
  user,
  companyId,
  currencySettings,
}: {
  user: any;
  companyId: string;
  currencySettings: CurrencySettings;
}) {
  const data = await getSalaryInsightsMetrics(user, companyId);
  return <SalaryInsightsOverview data={data} currencySettings={currencySettings} />;
}
