"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthorization } from "@/hooks/useAuthorization";
import {
  CheckCircle2,
  DollarSign,
  FileText,
  Mail,
  Phone,
  ShipWheel,
  UserRound,
  CalendarDays,
} from "lucide-react";
import LeaveSettingsPanel from "@/components/Crews/LeaveSettingsPanel";
import Badge from "@/components/ui/badge/Badge";
import CandidateApplicationForm, {
  CandidateApplicationData,
} from "@/components/Jobs/Application";
import PayscaleSettingsPanel from "@/components/Crews/PayscaleSettingsPanel";
import NewContractModal from "@/components/Contracts/NewContractModal";
import ConfirmOnboardModal from "@/components/Onboarding/ConfirmOnboardModal";
import Select from "@/components/form/Select";
import { toast } from "react-toastify";
import type { Settings } from "@/lib/payrollVerificationAccess";

type CrewEditTabId = "crew" | "contract" | "payscale" | "onboarding" | "leave-settings";

interface OnboardingChecklistItem {
  _id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

interface CrewEditData extends CandidateApplicationData {
  _id: string;
  company?: string;
  companyName?: string;
  crew?: string;
  jobTitle?: string | null;
  onboardDate?: string;
  onboardPort?: string;
  contractStart?: string;
  contractEnd?: string;
  contractPeriod?: string;
  contractRaw?: any;
  onboardingChecklist?: OnboardingChecklistItem[];
  leaveLimits?: Array<{ leaveTypeId: string; maxDays: number }>;
}

interface CrewEditPageClientProps {
  crew: CrewEditData;
  companyId: string;
  companyName?: string;
  companyLogo?: string;
  availablePositions: { value: string; label: string }[];
  jobId?: string;
  isSuperAdmin: boolean;
  companies: { value: string; label: string }[];
  initialTab: CrewEditTabId;
  canEditCandidate: boolean;
  canEditContract: boolean;
  canManageOnboarding: boolean;
  vesselOptions: { value: string; label: string; id: string }[];
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

const CREW_STATUS_OPTIONS = [
  { value: "onboard", label: "Onboard" },
  { value: "vacation", label: "Vacation" },
  { value: "available", label: "Available" },
  { value: "traveling", label: "Traveling" },
  { value: "medical_leave", label: "Medical Leave" },
  { value: "training", label: "Training" },
  { value: "inactive", label: "Inactive" },
  { value: "resigned", label: "Resigned" },
  { value: "blacklisted", label: "Blacklisted" },
];

function formatDateOnly(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB");
}

function PermissionNote({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
      {message}
    </div>
  );
}

export default function CrewEditPageClient({
  crew,
  companyId,
  companyName,
  companyLogo,
  availablePositions,
  jobId,
  isSuperAdmin,
  companies,
  initialTab,
  canEditCandidate,
  canEditContract,
  canManageOnboarding,
  vesselOptions,
  currencyCode = "USD",
  currencySettings,
}: CrewEditPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can } = useAuthorization();

  const canConfirmOnboard = can("onboarding.confirm");
  const canEditOnboardingDetails = can("onboarding.edit");
  const showOnboardingForm =
    (crew.status === "onboarded" && canEditOnboardingDetails) ||
    (crew.status === "onboarding_ready" && canConfirmOnboard);

  const [currentCrewStatus, setCurrentCrewStatus] = useState(
    crew.crew || "inactive",
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/applications/${crew._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crew: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setCurrentCrewStatus(newStatus);
      toast.success("Crew status updated successfully");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const [liveSummary, setLiveSummary] = useState(() => ({
    firstName: crew.firstName || "",
    lastName: crew.lastName || "",
    rank: crew.rank || "",
    positionApplied: crew.jobTitle || crew.positionApplied || "",
    nationality: crew.nationality || "",
    email: crew.email || "",
    cellPhone: crew.cellPhone || "",
    status: crew.status || "",
    vesselName:
      crew.contractRaw?.vesselId?.name || crew.contractRaw?.vesselName || "",
  }));

  const tabs = useMemo(
    () => [
      {
        id: "crew" as CrewEditTabId,
        label: "Crew Details",
        variant: "primary" as const,
        icon: <UserRound className="h-4 w-4" />,
      },
      {
        id: "contract" as CrewEditTabId,
        label: "Contract Details",
        variant: "warning" as const,
        icon: <FileText className="h-4 w-4" />,
      },
      {
        id: "payscale" as CrewEditTabId,
        label: "Payscale Settings",
        variant: "primary" as const,
        icon: <DollarSign className="h-4 w-4" />,
      },
      {
        id: "onboarding" as CrewEditTabId,
        label: "Onboarding Details",
        variant: "success" as const,
        icon: <CheckCircle2 className="h-4 w-4" />,
      },
      {
        id: "leave-settings" as CrewEditTabId,
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

  const displayName =
    `${liveSummary.firstName || ""} ${liveSummary.lastName || ""}`.trim();
  const displayMeta = [
    liveSummary.rank,
    liveSummary.positionApplied,
    liveSummary.nationality,
  ]
    .filter(Boolean)
    .join(" · ");
  const topApplicationStatus =
    liveSummary.status && applicationStatusMap[liveSummary.status]
      ? applicationStatusMap[liveSummary.status]
      : null;

  const handleCandidatePreviewChange = useCallback(
    (data: {
      firstName?: string;
      lastName?: string;
      rank?: string;
      positionApplied?: string;
      nationality?: string;
      email?: string;
      cellPhone?: string;
      status?: string;
    }) => {
      setLiveSummary((prev) => ({ ...prev, ...data }));
    },
    [],
  );

  const handleContractPreviewChange = useCallback(
    (data: { vesselName?: string }) => {
      setLiveSummary((prev) => ({ ...prev, ...data }));
    },
    [],
  );

  return (
    <div className="space-y-6">
      <div className="relative rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
        
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
                  <span>{liveSummary.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-brand-200" />
                  <span>{liveSummary.cellPhone || "No phone"}</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 rounded-2xl bg-white dark:bg-slate-800 p-5 sm:p-6 shadow-md border border-gray-100 dark:border-white/10">
            <div className="flex flex-col justify-center gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Crew Status
              </span>
              <div className="mt-1">
                <Select
                  value={currentCrewStatus}
                  onChange={(val) => handleStatusChange(val)}
                  options={CREW_STATUS_OPTIONS}
                  disabled={isUpdatingStatus || !canEditCandidate}
                  placeholder="Select Status"
                />
              </div>
            </div>
            
            {/* <div className="flex flex-col justify-center gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Application
              </span>
              <div className="mt-1.5">
                {topApplicationStatus ? (
                  <Badge color={topApplicationStatus.color}>
                    {topApplicationStatus.label}
                  </Badge>
                ) : (
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {liveSummary.status || "-"}
                  </span>
                )}
              </div>
            </div> */}

            <div className="flex flex-col justify-center gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Onboard Date
              </span>
              <span className="mt-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                {formatDateOnly(crew.onboardDate)}
              </span>
            </div>

            <div className="flex flex-col justify-center gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Vessel
              </span>
              <div className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                <ShipWheel className="h-4 w-4 text-brand-500" />
                <span className="truncate max-w-[150px] sm:max-w-none">{liveSummary.vesselName || "-"}</span>
              </div>
            </div>
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
            {initialTab === "crew" &&
          (canEditCandidate ? (
            <CandidateApplicationForm
              mode="edit"
              companyId={companyId}
              companyName={companyName}
              companyLogo={companyLogo}
              initialData={crew}
              applicationId={crew._id}
              availablePositions={availablePositions}
              jobId={jobId}
              isSuperAdmin={isSuperAdmin}
              companies={companies}
              isCrewApplication={true}
              onLivePreviewChange={handleCandidatePreviewChange}
            />
          ) : (
            <PermissionNote message="You do not have permission to edit crew details." />
          ))}

        {initialTab === "contract" &&
          (canEditContract ? (
            <div className="mx-auto w-full max-w-5xl px-2 sm:px-4 lg:px-6">
              <NewContractModal
                embedded
                isOpen
                onClose={() =>
                  router.push(`/crews/view/${crew._id}?tab=contract`)
                }
                application={crew as any}
                mode="edit"
                vesselOptions={vesselOptions}
                onStatusChange={() => router.refresh()}
                onLivePreviewChange={handleContractPreviewChange}
                currencyCode={currencyCode}
              />
            </div>
          ) : (
            <PermissionNote message="You do not have permission to edit contract details." />
          ))}

        {initialTab === "payscale" &&
          (crew.contractRaw ? (
            <PayscaleSettingsPanel
              contract={crew.contractRaw}
              canEdit={canEditContract}
              canDelete={can("contracts.delete")}
              currencyCode={currencyCode}
              currencySettings={currencySettings}
            />
          ) : (
            <PermissionNote message="Create contract details first to manage payscale periods." />
          ))}

        {initialTab === "onboarding" &&
          (canManageOnboarding ? (
            <div className="mx-auto min-w-0 w-full max-w-4xl px-2 sm:px-4 lg:px-6">
              {showOnboardingForm ? (
                <ConfirmOnboardModal
                  embedded
                  isOpen
                  onClose={() => {}}
                  applicationId={crew._id}
                  candidateName={displayName || "Crew Member"}
                  positionApplied={crew.jobTitle || crew.positionApplied}
                  profilePhoto={crew.profilePhoto}
                  mode={crew.status === "onboarded" ? "edit" : "confirm"}
                  initialValues={{
                    onboardDate: crew.onboardDate,
                    port: crew.onboardPort,
                    contractStart: crew.contractStart,
                    contractEnd: crew.contractEnd,
                    contractPeriod: crew.contractPeriod,
                  }}
                  onSuccess={() => router.refresh()}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400">
                  {crew.status === "onboarded"
                    ? "You do not have permission to edit onboard details."
                    : "Complete the onboarding checklist to enable crew confirmation."}
                </div>
              )}
            </div>
          ) : (
            <PermissionNote message="You do not have permission to manage onboarding details." />
          ))}

        {initialTab === "leave-settings" && (
          <LeaveSettingsPanel
            crewId={crew._id || ""}
            companyId={companyId}
            initialLeaveLimits={crew.leaveLimits}
            canEdit={canEditCandidate}
          />
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
