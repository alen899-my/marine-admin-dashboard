"use client";

import { ReactNode, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  DollarSign,
  FileText,
  Mail,
  Phone,
  UserRound,
  Pencil,
  ShipWheel,
} from "lucide-react";
import LeaveSettingsPanel from "@/components/Crews/LeaveSettingsPanel";
import CandidateApplicationForm, {
  CandidateApplicationData,
} from "@/components/Jobs/Application";
import PayscaleSettingsPanel from "@/components/Crews/PayscaleSettingsPanel";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import ComponentCard from "@/components/common/ComponentCard";
import { useAuthorization } from "@/hooks/useAuthorization";
import type { Settings } from "@/lib/payrollVerificationAccess";

type CrewTabId = "crew" | "contract" | "payscale" | "onboarding" | "leave-settings";

interface OnboardingChecklistItem {
  _id?: string;
  text: string;
  completed: boolean;
  createdAt?: string;
}

interface ContractWageAllowance {
  label: string;
  value: number;
}

interface ContractWages {
  basic?: number | string;
  otherAllowance?: number | string;
  allowances?: ContractWageAllowance[];
  effectiveFrom?: string;
  effectiveTo?: string | null;
}

interface ContractDetails {
  _id?: string;
  portOfJoining?: string;
  vesselId?: {
    name?: string;
  };
  vesselName?: string;
  commencement?: string;
  contractPeriod?: string;
  referenceNo?: string;
  signDate?: string;
  signPlace?: string;
  cdcNo?: string;
  indosNo?: string;
  wages?: ContractWages;
  wagesHistory?: Array<
    ContractWages & {
      _id?: string;
      isCurrent?: boolean;
      createdAt?: string;
    }
  >;
}

export interface CrewDetailsData extends CandidateApplicationData {
  company?: string;
  companyName?: string;
  crew?: string;
  jobTitle?: string | null;
  onboardDate?: string;
  onboardPort?: string;
  contractStart?: string;
  contractEnd?: string;
  contractPeriod?: string;
  onboardingChecklist?: OnboardingChecklistItem[];
  contractRaw?: ContractDetails | null;
  leaveLimits?: Array<{ leaveTypeId: string; maxDays: number }>;
}

interface CrewDetailsPageClientProps {
  crew: CrewDetailsData;
  companyId: string;
  initialTab: CrewTabId;
  currencyCode?: string;
  currencySettings?: Pick<
    Settings,
    "currencyPosition" | "currencyFormatType" | "currencySpace"
  >;
}

const applicationStatusMap: Record<
  string,
  {
    color:
      | "slate"
      | "sky"
      | "indigo"
      | "purple"
      | "cyan"
      | "teal"
      | "emerald"
      | "lime"
      | "green"
      | "gray"
      | "rose";
    label: string;
  }
> = {
  draft: { color: "slate", label: "Draft" },
  submitted: { color: "sky", label: "Submitted" },
  hr_review: { color: "indigo", label: "HR Review" },
  shortlisted: { color: "purple", label: "Shortlisted" },
  interview_scheduled: { color: "cyan", label: "Interview Scheduled" },
  interview_completed: { color: "teal", label: "Interview Completed" },
  selected: { color: "emerald", label: "Selected" },
  offer_sea_issued: { color: "lime", label: "Offer/SEA Issued" },
  accepted: { color: "green", label: "Accepted" },
  onboarding_ready: { color: "green", label: "Onboarding Ready" },
  onboarded: { color: "green", label: "Onboarded" },
  rejected: { color: "rose", label: "Rejected" },
};

const crewStatusMap: Record<string, { color: string; label: string }> = {
  onboard: { color: "success", label: "Onboard" },
  vacation: { color: "blue", label: "Vacation" },
  available: { color: "emerald", label: "Available" },
  traveling: { color: "purple", label: "Traveling" },
  medical_leave: { color: "warning", label: "Medical Leave" },
  training: { color: "indigo", label: "Training" },
  inactive: { color: "light", label: "Inactive" },
  resigned: { color: "rose", label: "Resigned" },
  blacklisted: { color: "error", label: "Blacklisted" },
};

function formatDateOnly(value?: string | null) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB");
}

function DetailRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-gray-100 last:border-b-0 dark:border-white/10">
      <span className="text-gray-500 shrink-0">{label}</span>
      <div className="font-medium text-right text-gray-800 dark:text-white/90">
        {value || "-"}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
      {message}
    </div>
  );
}

function ContractTab({ crew }: { crew: CrewDetailsData }) {
  const contract = crew.contractRaw;

  if (!contract) {
    return (
      <EmptyState message="No contract details are available for this crew member." />
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
        <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
          Vessel & Contract
        </h3>
        <DetailRow label="Port of Joining" value={contract.portOfJoining} />
        <DetailRow
          label="Vessel Name"
          value={contract.vesselId?.name || contract.vesselName}
        />
        <DetailRow
          label="Commencement Date"
          value={formatDateOnly(contract.commencement)}
        />
        <DetailRow label="Contract Period" value={contract.contractPeriod} />
        <DetailRow label="Reference No" value={contract.referenceNo} />
        <DetailRow
          label="Sign Date"
          value={formatDateOnly(contract.signDate)}
        />
        <DetailRow label="Sign Place" value={contract.signPlace} />
      </section>

      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
          <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
            Seafarer Details
          </h3>
          <DetailRow label="CDC Number" value={contract.cdcNo} />
          <DetailRow label="INDOS Number" value={contract.indosNo} />
        </section>

        <section className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-5 dark:border-brand-500/20 dark:bg-brand-500/10">
          <h3 className="text-sm font-semibold text-brand-700 dark:text-brand-300">
            Payscale Settings
          </h3>
          <p className="mt-2 text-sm text-brand-700/80 dark:text-brand-200/80">
            Use the payscale tab to manage wage periods, allowances, and
            historical rate changes for this crew member.
          </p>
        </section>
      </div>
    </div>
  );
}

function OnboardingTab({ crew }: { crew: CrewDetailsData }) {
  const applicationStatus =
    crew.status && applicationStatusMap[crew.status]
      ? applicationStatusMap[crew.status]
      : null;

  return (
    <div className="grid grid-cols-1 gap-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
        <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
          Onboarding Summary
        </h3>
        <DetailRow
          label="Application Status"
          value={
            applicationStatus ? (
              <Badge color={applicationStatus.color}>
                {applicationStatus.label}
              </Badge>
            ) : (
              crew.status || "-"
            )
          }
        />
        <DetailRow
          label="Crew Status"
          value={
            (() => {
              const status = crew.crew || "inactive";
              const config = crewStatusMap[status] || { color: "light", label: status };
              return (
                <Badge color={config.color as any}>
                  {config.label}
                </Badge>
              );
            })()
          }
        />
        <DetailRow
          label="Onboard Date"
          value={formatDateOnly(crew.onboardDate)}
        />
        <DetailRow label="Onboard Port" value={crew.onboardPort} />
        <DetailRow
          label="Contract Start"
          value={formatDateOnly(crew.contractStart)}
        />
        <DetailRow
          label="Contract End"
          value={formatDateOnly(crew.contractEnd)}
        />
        <DetailRow label="Contract Period" value={crew.contractPeriod} />
      </section>
    </div>
  );
}

export default function CrewDetailsPageClient({
  crew,
  companyId,
  initialTab,
  currencyCode = "USD",
  currencySettings,
}: CrewDetailsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can, canAny, isReady } = useAuthorization();
  const canEdit = canAny(["crews.edit", "candidates.edit"]);

  const tabs = useMemo(
    () => [
      {
        id: "crew" as CrewTabId,
        label: "Crew Details",
        variant: "primary" as const,
        icon: <UserRound className="h-4 w-4" />,
      },
      {
        id: "contract" as CrewTabId,
        label: "Contract Details",
        variant: "warning" as const,
        icon: <FileText className="h-4 w-4" />,
      },
      {
        id: "payscale" as CrewTabId,
        label: "Payscale Settings",
        variant: "primary" as const,
        icon: <DollarSign className="h-4 w-4" />,
      },
      {
        id: "onboarding" as CrewTabId,
        label: "Onboarding Details",
        variant: "success" as const,
        icon: <CheckCircle2 className="h-4 w-4" />,
      },
      {
        id: "leave-settings" as CrewTabId,
        label: "Leave Settings",
        variant: "primary" as const,
        icon: <CalendarDays className="h-4 w-4" />,
      },
    ],
    [],
  );

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (tabId === "crew") {
      params.delete("tab");
    } else {
      params.set("tab", tabId);
    }

    const nextUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;
    router.replace(nextUrl);
  };

  const displayName = `${crew.firstName || ""} ${crew.lastName || ""}`.trim();
  const displayMeta = [
    crew.rank,
    crew.jobTitle || crew.positionApplied,
    crew.nationality,
  ]
    .filter(Boolean)
    .join(" · ");
  const topApplicationStatus =
    crew.status && applicationStatusMap[crew.status]
      ? applicationStatusMap[crew.status]
      : null;

  if (!isReady) return null;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
        
        {/* Hero header — full bleed brand bg */}
        <div className="relative px-6 pt-8 pb-14 sm:px-8 sm:pt-10 sm:pb-16 bg-gradient-to-br from-brand-500 to-brand-700 overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute top-4 right-1/3 h-20 w-20 rounded-full bg-white/5" />

          <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex-1 order-last sm:order-first">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1.5">
                {displayName || "Crew Member"}
              </h1>
              <p className="text-brand-100 text-sm sm:text-base font-medium mb-4">
                {displayMeta || "No profile details"}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-brand-200" />
                  <span>{crew.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-brand-200" />
                  <span>{crew.cellPhone || "No phone"}</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 order-first sm:order-last">
              <div className="h-20 w-20 sm:h-28 sm:w-28 rounded-2xl overflow-hidden border-2 border-white/40 shadow-theme-md bg-brand-400">
                {crew.profilePhoto ? (
                  <img
                    src={crew.profilePhoto}
                    alt={displayName || "Crew Member"}
                    className="object-cover h-full w-full bg-white dark:bg-slate-900"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-brand-500">
                    <svg className="w-10 h-10 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Area — overlapping the fold */}
        <div className="relative -mt-8 sm:-mt-10 px-4 sm:px-8 pb-6 sm:pb-8">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 sm:gap-8 rounded-2xl bg-white dark:bg-slate-800 p-5 sm:p-6 shadow-md border border-gray-100 dark:border-white/10">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Crew Status
              </span>
              <div className="mt-1">
                {(() => {
                  const status = crew.crew || "inactive";
                  const config = crewStatusMap[status] || { color: "light", label: status };
                  return (
                    <Badge color={config.color as any}>
                      {config.label}
                    </Badge>
                  );
                })()}
              </div>
            </div>
            
            {/* <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Application
              </span>
              <div>
                {topApplicationStatus ? (
                  <Badge color={topApplicationStatus.color}>
                    {topApplicationStatus.label}
                  </Badge>
                ) : (
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {crew.status || "-"}
                  </span>
                )}
              </div>
            </div> */}

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Onboard Date
              </span>
              <span className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {formatDateOnly(crew.onboardDate)}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Vessel
              </span>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                <ShipWheel className="h-4 w-4 text-brand-500" />
                <span className="truncate max-w-[150px] sm:max-w-none">
                  {crew.contractRaw?.vesselId?.name || crew.contractRaw?.vesselName || "-"}
                </span>
              </div>
            </div>

            {canEdit && (
              <div className="col-span-2 sm:col-span-1 sm:ml-auto flex items-center justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => router.push(`/crews/edit/${crew._id || crew.crew || ""}`)}
                  startIcon={<Pencil className="h-4 w-4" />}
                >
                  Edit
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {/* Underline Tabs Navigation */}
        <div className="border-b border-gray-200 dark:border-white/10 px-2 sm:px-6">
          <nav className="-mb-px flex gap-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {tabs.map((tab) => {
              const isActive = tab.id === initialTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    group flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      isActive
                        ? "border-brand-500 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                    }
                  `}
                >
                  <span className={`${isActive ? "text-brand-500 dark:text-brand-400" : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500"} transition-colors`}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 lg:p-8 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="space-y-6">
              {initialTab === "crew" && (
                <CandidateApplicationForm
                  mode="view"
                  companyId={companyId}
                  initialData={crew}
                  embeddedView
                  hideViewProfileHeader
                />
              )}

              {initialTab === "contract" && <ContractTab crew={crew} />}

              {initialTab === "payscale" && (
                <PayscaleSettingsPanel
                  contract={crew.contractRaw}
                  canEdit={can("contracts.edit")}
                  canDelete={can("contracts.delete")}
                  readOnly
                  currencyCode={currencyCode}
                  companyId={companyId}
                  currencySettings={currencySettings}
                />
              )}

              {initialTab === "onboarding" && <OnboardingTab crew={crew} />}

              {initialTab === "leave-settings" && (
                <LeaveSettingsPanel
                  crewId={crew._id || ""}
                  companyId={companyId}
                  initialLeaveLimits={crew.leaveLimits}
                  canEdit={false}
                />
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
