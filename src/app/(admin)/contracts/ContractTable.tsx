"use client";

import React from "react";

import Badge from "@/components/ui/badge/Badge";
import CommonReportTable from "@/components/tables/CommonReportTable";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/button/Button";
import {
  Eye,
  PenBox,
  Trash2,
  FileText,
  Plus,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";
import NewContractModal from "@/components/Contracts/NewContractModal";
import ViewModal from "@/components/common/ViewModal";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import SeaPreviewModal from "@/components/Contracts/SeaPreviewModal";
import { toast } from "react-toastify";
import { getWageTotal } from "@/lib/wageHistory";
import { formatCurrency } from "@/lib/formatCurrency";
import { getCurrencySymbol } from "@/constants/geoData";
import EditModal from "@/components/common/EditModal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { useAllowanceDeductionOptions } from "@/hooks/useAllowanceDeductionOptions";
import { PrefixInput } from "@/components/Contracts/PrefixInput";
import { useSidebarNotifications } from "@/context/SidebarNotificationContext";

interface Application {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  rank: string;
  nationality: string;
  status:
    | "draft"
    | "submitted"
    | "hr_review"
    | "shortlisted"
    | "interview_scheduled"
    | "interview_completed"
    | "selected"
    | "offer_sea_issued"
    | "accepted"
    | "onboarding_ready"
    | "onboarded"
    | "rejected";
  positionApplied?: string;
  jobTitle?: string | null;
  dateOfAvailability?: string;
  cellPhone?: string;
  createdAt: string;
  company: string;
  companyName?: string;

  // Contract-specific fields
  cdcIndosNo?: string;
  vesselOrPort?: string;
  commencement?: string;
  period?: string;
  basicWages?: string | number;
  contractStatus?:
    | "active"
    | "expired"
    | "pending"
    | "terminated"
    | "draft"
    | "generated"
    | "sent"
    | string;
  contractRaw?: any;
}

interface ContractTableProps {
  data: Application[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isSuperAdmin?: boolean;
  vessels: { value: string; label: string; id: string }[];
  currencyCode?: string;
  currencySettings?: {
    currencyPosition: "left" | "right";
    currencyFormatType: "symbol" | "code";
    currencySpace: boolean;
  };
}

interface WageHistoryRecord {
  _id?: string;
  basic?: number | string;
  otherAllowance?: number | string | { value: number | string; type: 'amount' | 'percent' };
  allowances?: { label: string; value: number; type?: 'amount' | 'percent' }[];
  effectiveFrom?: string;
  effectiveTo?: string | null;
  createdAt?: string;
}

interface WageHistoryFormState {
  effectiveFrom: string;
  effectiveTo: string;
  basic: string;
  otherAllowance: { value: string; type: 'amount' | 'percent' };
  allowances: { label: string; value: string; type?: 'amount' | 'percent' }[];
}

const statusMap: Record<
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

const contractStatusMap: Record<
  string,
  {
    color: "emerald" | "rose" | "sky" | "slate" | "amber" | "indigo";
    label: string;
  }
> = {
  active: { color: "emerald", label: "Active" },
  expired: { color: "rose", label: "Expired" },
  pending: { color: "sky", label: "Pending" },
  draft: { color: "amber", label: "Draft" },
  generated: { color: "indigo", label: "Generated" },
  terminated: { color: "slate", label: "Terminated" },
};

export default function ContractTable({
  data,
  pagination,
  isSuperAdmin = false,
  vessels,
  currencyCode = "USD",
  currencySettings,
}: ContractTableProps): React.ReactElement | null {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshCounts } = useSidebarNotifications();
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const { options: allowanceOptions, loading: loadingAllowances } =
    useAllowanceDeductionOptions("allowance", selectedApplication?.company);

  const { can, isReady } = useAuthorization();
  const canEdit = can("contracts.edit");
  const canDelete = can("contracts.delete");
  const canCreate = can("contracts.create");
  const canGenerateSea = can("sea.document.generate");
  const canEditCandidateStatus = can("candidates.edit");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [seaPreviewOpen, setSeaPreviewOpen] = useState(false);
  const [seaPreviewApplication, setSeaPreviewApplication] =
    useState<Application | null>(null);
  const [selectedWageHistory, setSelectedWageHistory] =
    useState<WageHistoryRecord | null>(null);
  const [wageHistoryViewOpen, setWageHistoryViewOpen] = useState(false);
  const [wageHistoryEditOpen, setWageHistoryEditOpen] = useState(false);
  const [wageHistoryDeleteOpen, setWageHistoryDeleteOpen] = useState(false);
  const [wageHistorySaving, setWageHistorySaving] = useState(false);
  const [wageHistoryDeleting, setWageHistoryDeleting] = useState(false);
  const [acceptingApplicationId, setAcceptingApplicationId] = useState<
    string | null
  >(null);
  const [wageHistoryForm, setWageHistoryForm] = useState<WageHistoryFormState>({
    effectiveFrom: "",
    effectiveTo: "",
    basic: "",
    otherAllowance: { value: "", type: "amount" },
    allowances: [],
  });

  // Keep the modal data in sync after auto-save / router.refresh()
  useEffect(() => {
    if (selectedApplication?._id && modalOpen) {
      const updated = data.find((a) => a._id === selectedApplication._id);
      if (updated) {
        setSelectedApplication(updated);
      }
    }
  }, [data, modalOpen]);

  const formatDateOnly = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatValue = (value?: string | number | null) => {
    if (value === null || value === undefined || value === "") return "-";
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return "-";
    return formatCurrency(parsed, currencyCode, { currencySettings });
  };

  const formatWagePeriod = (
    effectiveFrom?: string,
    effectiveTo?: string,
    createdAt?: string,
  ) => {
    const fromSource = effectiveFrom || createdAt;
    if (!fromSource) return "Effective date not set";

    const from = formatDateOnly(fromSource);
    const to = effectiveTo ? formatDateOnly(effectiveTo) : "Present";
    return `${from} to ${to}`;
  };

  const createWageHistoryForm = (
    wage: WageHistoryRecord | null,
  ): WageHistoryFormState => ({
    effectiveFrom: wage?.effectiveFrom
      ? String(wage.effectiveFrom).split("T")[0]
      : "",
    effectiveTo: wage?.effectiveTo
      ? String(wage.effectiveTo).split("T")[0]
      : "",
    basic:
      wage?.basic !== undefined && wage?.basic !== null
        ? String(wage.basic)
        : "",
    otherAllowance: (wage?.otherAllowance && typeof wage.otherAllowance === 'object')
      ? { value: String((wage.otherAllowance as any).value || ""), type: (wage.otherAllowance as any).type || 'amount' }
      : { value: wage?.otherAllowance != null ? String(wage.otherAllowance) : "", type: 'amount' },
    allowances: Array.isArray(wage?.allowances)
      ? wage.allowances.map((allowance) => ({
          label: String(allowance.label || ""),
          value:
            allowance.value !== undefined && allowance.value !== null
              ? String(allowance.value)
              : "",
          type: (allowance as any).type || 'amount',
        }))
      : [],
  });

  useEffect(() => {
    if (wageHistoryEditOpen) {
      setWageHistoryForm(createWageHistoryForm(selectedWageHistory));
    }
  }, [selectedWageHistory, wageHistoryEditOpen]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  const handleDelete = async () => {
    if (!contractToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/contracts/${contractToDelete}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete");
      }

      toast.success("Contract deleted successfully");
      await refreshCounts();
      router.refresh();
      setDeleteModalOpen(false);
      setContractToDelete(null);
    } catch (error: any) {
      toast.error(
        error.message || "An error occurred while deleting the contract",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAccepted = async (applicationId: string) => {
    setAcceptingApplicationId(applicationId);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result?.error || "Failed to update candidate status");
      }

      toast.success("Candidate status updated to Accepted");
      await refreshCounts();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update candidate status");
    } finally {
      setAcceptingApplicationId(null);
    }
  };

  const selectedContractId = selectedApplication?.contractRaw?._id;

  const handleWageHistorySave = async () => {
    if (!selectedContractId || !selectedWageHistory?._id) return;

    setWageHistorySaving(true);
    try {
      const res = await fetch(
        `/api/contracts/${selectedContractId}/wages/${selectedWageHistory._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            effectiveFrom: wageHistoryForm.effectiveFrom,
            effectiveTo: wageHistoryForm.effectiveTo || null,
            basic: Number(wageHistoryForm.basic) || 0,
            otherAllowance: {
              value: Number(wageHistoryForm.otherAllowance.value) || 0,
              type: wageHistoryForm.otherAllowance.type,
            },
            allowances: wageHistoryForm.allowances
              .map((allowance) => ({
                label: allowance.label.trim(),
                value: Number(allowance.value) || 0,
                type: allowance.type || 'amount',
              }))
              .filter((allowance) => allowance.label),
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to update salary history");
      }

      toast.success("Salary history updated");
      setWageHistoryEditOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update salary history");
    } finally {
      setWageHistorySaving(false);
    }
  };

  const handleWageHistoryDelete = async () => {
    if (!selectedContractId || !selectedWageHistory?._id) return;

    setWageHistoryDeleting(true);
    try {
      const res = await fetch(
        `/api/contracts/${selectedContractId}/wages/${selectedWageHistory._id}`,
        { method: "DELETE" },
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete salary history");
      }

      toast.success("Salary history deleted");
      setWageHistoryDeleteOpen(false);
      setWageHistoryViewOpen(false);
      setSelectedWageHistory(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete salary history");
    } finally {
      setWageHistoryDeleting(false);
    }
  };

  const columns = [
    {
      header: "S.No",
      render: (_: any, index: number) =>
        (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      header: "Candidate",
      render: (a: Application) => (
        <div className="flex flex-col gap-0.5 min-w-[160px]">
          <button
            type="button"
            onClick={() => router.push(`/jobs/view/${a._id}`)}
            className="group flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer text-left w-fit"
          >
            {a.firstName} {a.lastName}
            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {a.email}
          </span>
          <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
            {a.jobTitle || a.positionApplied || "—"}
          </span>
          <span className="text-xs text-gray-400">{a.rank || "—"}</span>
        </div>
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            header: "Company",
            render: (a: Application) => (
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {a.companyName || "—"}
              </span>
            ),
          },
        ]
      : []),
    // {
    //   header: "CDC / INDOS No",
    //   render: (a: Application) => (
    //     <span className="text-sm text-gray-700 dark:text-gray-300">
    //       {a.cdcIndosNo || "—"}
    //     </span>
    //   ),
    // },
    // {
    //   header: "Vessel / Port",
    //   render: (a: Application) => (
    //     <span className="text-sm text-gray-700 dark:text-gray-300">
    //       {a.vesselOrPort || "—"}
    //     </span>
    //   ),
    // },
    // {
    //   header: "Commencement",
    //   render: (a: Application) => (
    //     <span className="text-sm text-gray-700 dark:text-gray-300">
    //       {formatDateOnly(a.commencement)}
    //     </span>
    //   ),
    // },
    // {
    //   header: "Period",
    //   render: (a: Application) => (
    //     <span className="text-sm text-gray-700 dark:text-gray-300">
    //       {a.period || "—"}
    //     </span>
    //   ),
    // },
    // {
    //   header: "Basic Wages",
    //   render: (a: Application) => (
    //     <span className="text-sm text-gray-700 dark:text-gray-300">
    //       {a.basicWages != null ? a.basicWages : "—"}
    //     </span>
    //   ),
    // },
    {
      header: "Status",
      render: (a: Application) => {
        const config = statusMap[a.status] ?? statusMap.draft;
        return <Badge color={config.color}>{config.label}</Badge>;
      },
    },
    {
      header: "Contract Status",
      render: (a: Application) => {
        const status = a.contractStatus || "pending";
        const config = contractStatusMap[status] ?? contractStatusMap.pending;
        return <Badge color={config.color}>{config.label}</Badge>;
      },
    },
    ...(canGenerateSea
      ? [
          {
            header: "Documents",
            render: (a: Application) => (
              <div className="flex gap-2">
                {a.contractStatus === "generated" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSeaPreviewApplication(a);
                      setSeaPreviewOpen(true);
                    }}
                  >
                    <FileText className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    <span className="text-sky-600 dark:text-sky-400">SEA</span>
                  </Button>
                ) : (
                  <span className="text-xs text-gray-400 italic">
                    Not available
                  </span>
                )}
              </div>
            ),
          },
        ]
      : []),

    {
      header: "Actions",
      render: (a: Application) => (
        <div className="flex gap-2">
          {canEditCandidateStatus && a.status === "offer_sea_issued" && (
            <Button
              size="sm"
              variant="outline"
              className="px-2 text-xs dark:border-gray-600"
              disabled={acceptingApplicationId === a._id}
              onClick={(e) => {
                e.stopPropagation();
                void handleMarkAccepted(a._id);
              }}
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                {acceptingApplicationId === a._id
                  ? "Updating..."
                  : "Mark Accepted"}
              </span>
            </Button>
          )}

          {canCreate && a.contractStatus !== "generated" && (
            <Button
              size="sm"
              variant="outline"
              className="px-2 text-xs dark:border-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedApplication(a);
                setModalMode("add");
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                {a.contractStatus === "draft" ? "Continue" : "New Contract"}
              </span>
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="dark:border-gray-600"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedApplication(a);
              setModalMode("view");
              setModalOpen(true);
            }}
          >
            <Eye className="h-4 w-4 text-blue-500" />
          </Button>

          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              className="dark:border-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedApplication(a);
                setModalMode("edit");
                setModalOpen(true);
              }}
            >
              <PenBox className="h-4 w-4 text-yellow-500" />
            </Button>
          )}

          {canDelete && (
            <Button
              size="sm"
              variant="outline"
              className="dark:border-gray-600"
              disabled={!a.contractRaw?._id}
              onClick={(e) => {
                e.stopPropagation();
                if (a.contractRaw?._id) {
                  setContractToDelete(a.contractRaw._id);
                  setDeleteModalOpen(true);
                } else {
                  toast.error("No contract exists to delete yet.");
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (!isReady) return null;

  return (
    <>
      <div className="border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900 rounded-xl">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1500px]">
            <CommonReportTable
              data={data}
              columns={columns}
              loading={false}
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      {modalMode !== "view" && (
        <NewContractModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedApplication(null);
          }}
          application={selectedApplication}
          mode={modalMode}
          vesselOptions={vessels}
          onStatusChange={() => router.refresh()}
          currencyCode={currencyCode}
          currencySettings={currencySettings}
        />
      )}

      <ViewModal
        isOpen={modalMode === "view" && modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedApplication(null);
        }}
        title="Contract Details"
        headerRight={
          selectedApplication && (
            <div className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
              <span className="font-bold">
                {selectedApplication.firstName} {selectedApplication.lastName}
              </span>
              <span>|</span>
              <span>
                {selectedApplication.jobTitle ||
                  selectedApplication.positionApplied}
              </span>
            </div>
          )
        }
      >
        <div className="text-[13px] py-1 space-y-6">
          {/* ── ROW 1: Seafarer Details  |  Vessel & Contract ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {/* ================= VESSEL & CONTRACT ================= */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                Vessel & Contract
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Port of Joining</span>
                <span className="font-medium text-right">
                  {selectedApplication?.contractRaw?.portOfJoining || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Vessel Name</span>
                <span className="font-medium text-right">
                  {selectedApplication?.contractRaw?.vesselId?.name ||
                    selectedApplication?.contractRaw?.vesselName ||
                    "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">
                  Commencement Date
                </span>
                <span className="font-medium text-right">
                  {selectedApplication?.contractRaw?.commencement
                    ? formatDateOnly(
                        selectedApplication.contractRaw.commencement,
                      )
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Contract Period</span>
                <span className="font-medium text-right">
                  {selectedApplication?.contractRaw?.contractPeriod || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Reference No</span>
                <span className="font-medium text-right">
                  {selectedApplication?.contractRaw?.referenceNo || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Sign Date</span>
                <span className="font-medium text-right">
                  {selectedApplication?.contractRaw?.signDate
                    ? formatDateOnly(selectedApplication.contractRaw.signDate)
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Sign Place</span>
                <span className="font-medium text-right">
                  {selectedApplication?.contractRaw?.signPlace || "-"}
                </span>
              </div>
            </section>
            {/* ================= SEAFARER DETAILS ================= */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                Seafarer Details
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">CDC Number</span>
                <span className="font-medium text-right">
                  {selectedApplication?.contractRaw?.cdcNo || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">INDOS Number</span>
                <span className="font-medium text-right">
                  {selectedApplication?.contractRaw?.indosNo || "-"}
                </span>
              </div>
            </section>
          </div>

          {/* ── ROW 2: Wages — full width, label | value, total at bottom ── */}
          <section>
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">
              Wages
            </h3>
            <div className="space-y-1.5">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">
                  Basic Wages ({currencyCode}/month)
                </span>
                <span className="font-medium text-right">
                  {formatValue(selectedApplication?.contractRaw?.wages?.basic)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">
                  Other Allowance ({currencyCode}/month)
                </span>
                <span className="font-medium text-right">
                  {(() => {
                    const other = selectedApplication?.contractRaw?.wages?.otherAllowance;
                    const isObj = typeof other === "object" && other !== null;
                    const val = isObj ? (other as any).value : other;
                    const type = isObj ? (other as any).type : "amount";
                    const numericVal = parseFloat(String(val)) || 0;
                    
                    if (numericVal <= 0) return "-";
                    return type === "percent" ? `${numericVal}%` : formatValue(numericVal);
                  })()}
                </span>
              </div>

              {/* Dynamic Allowances */}
              {selectedApplication?.contractRaw?.wages?.allowances?.map(
                (a: any, i: number) => (
                  <div key={i} className="flex justify-between gap-4">
                    <span className="text-gray-500 shrink-0">{a.label}</span>
                    <span className="font-medium text-right">
                      {a.type === "percent"
                        ? `${a.value}%`
                        : formatValue(a.value)}
                    </span>
                  </div>
                ),
              )}

              {/* Total Monthly Package */}
              <div className="flex justify-between gap-4 mt-3 pt-2 border-t border-dashed border-gray-100 dark:border-white/10">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[10px] tracking-wider">
                  Total Monthly Package
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {(() => {
                    const w = selectedApplication?.contractRaw?.wages;
                    if (!w) return "-";
                    const basic = parseFloat(w.basic || "0") || 0;
                    let otherVal = 0;
                    if (w.otherAllowance && typeof w.otherAllowance === 'object') {
                      const val = parseFloat(w.otherAllowance.value || "0") || 0;
                      otherVal = w.otherAllowance.type === 'percent' ? (basic * (val / 100)) : val;
                    } else {
                      otherVal = parseFloat(w.otherAllowance || "0") || 0;
                    }

                    const allowanceTotal = Array.isArray(w.allowances)
                      ? w.allowances.reduce((acc: number, curr: any) => {
                          const val = parseFloat(curr.value || "0") || 0;
                          const calculated = curr.type === 'percent' ? (basic * (val / 100)) : val;
                          return acc + calculated;
                        }, 0)
                      : 0;

                    const total = basic + otherVal + allowanceTotal;
                    return formatValue(total);
                  })()}
                </span>
              </div>
            </div>
          </section>

        </div>
      </ViewModal>

      <ViewModal
        isOpen={wageHistoryViewOpen}
        onClose={() => {
          setWageHistoryViewOpen(false);
          setSelectedWageHistory(null);
        }}
        title="Salary History Details"
        size="md"
      >
        {!selectedWageHistory ? null : (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Salary Period
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {formatWagePeriod(
                  selectedWageHistory.effectiveFrom,
                  selectedWageHistory.effectiveTo || undefined,
                  selectedWageHistory.createdAt,
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Basic
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  {formatValue(selectedWageHistory.basic)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Other Allowance
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  {(() => {
                    const other = selectedWageHistory.otherAllowance;
                    const isObj = typeof other === "object" && other !== null;
                    const val = isObj ? (other as any).value : other;
                    const type = isObj ? (other as any).type : "amount";
                    const numericVal = parseFloat(String(val)) || 0;
                    
                    if (numericVal <= 0) return "-";

                    return (
                      <>
                        {type === "percent" ? `${numericVal}%` : formatValue(numericVal)}
                      </>
                    );
                  })()}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Allowances
              </p>
              <div className="mt-2 space-y-2">
                {selectedWageHistory.allowances?.length ? (
                  selectedWageHistory.allowances.map((allowance, index) => (
                    <div
                      key={`${allowance.label || "allowance"}-${index}`}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span>{allowance.label || `Allowance ${index + 1}`}</span>
                      <span>
                        {allowance.type === "percent"
                          ? `${allowance.value}%`
                          : formatValue(allowance.value)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No allowances</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Total Monthly Package
              </p>
              <p className="mt-1 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                {formatValue(getWageTotal(selectedWageHistory))}
              </p>
            </div>
          </div>
        )}
      </ViewModal>

      <EditModal
        isOpen={wageHistoryEditOpen}
        onClose={() => {
          setWageHistoryEditOpen(false);
          setSelectedWageHistory(null);
        }}
        title="Edit Salary History"
        onSubmit={handleWageHistorySave}
        loading={wageHistorySaving}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              type="date"
              label="Effective From"
              value={wageHistoryForm.effectiveFrom}
              onChange={(e) =>
                setWageHistoryForm((prev) => ({
                  ...prev,
                  effectiveFrom: e.target.value,
                }))
              }
            />
            <Input
              type="date"
              label="Effective End Date"
              value={wageHistoryForm.effectiveTo}
              onChange={(e) =>
                setWageHistoryForm((prev) => ({
                  ...prev,
                  effectiveTo: e.target.value,
                }))
              }
            />
            <PrefixInput
              prefix={getCurrencySymbol(currencyCode)}
              label="Basic Wages"
              type="number"
              min="0"
              step={0.01}
              value={wageHistoryForm.basic}
              onChange={(e) =>
                setWageHistoryForm((prev) => ({
                  ...prev,
                  basic: e.target.value,
                }))
              }
            />
              <PrefixInput
                prefix={getCurrencySymbol(currencyCode)}
                label="Other Allowance"
                type="number"
                min="0"
                step={0.01}
                value={wageHistoryForm.otherAllowance.value}
                onChange={(e) =>
                  setWageHistoryForm((prev) => ({
                    ...prev,
                    otherAllowance: { ...prev.otherAllowance, value: e.target.value },
                  }))
                }
                showTypeSelector
                valueType={wageHistoryForm.otherAllowance.type}
                onTypeChange={(type) =>
                  setWageHistoryForm((prev) => ({
                    ...prev,
                    otherAllowance: { ...prev.otherAllowance, type },
                  }))
                }
              />
            </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Allowances
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setWageHistoryForm((prev) => ({
                    ...prev,
                    allowances: [...prev.allowances, { label: "", value: "", type: "amount" }],
                  }))
                }
              >
                Add Allowance
              </Button>
            </div>

            {wageHistoryForm.allowances.length ? (
              wageHistoryForm.allowances.map((allowance, index) => (
                <div
                  key={`edit-allowance-${index}`}
                  className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto]"
                >
                  <Select
                    label={index === 0 ? "Allowance Name" : ""}
                    options={allowanceOptions}
                    placeholder={
                      loadingAllowances ? "Loading..." : "Select allowance"
                    }
                    value={allowance.label}
                    onChange={(value) =>
                      setWageHistoryForm((prev) => {
                        const allowances = [...prev.allowances];
                        allowances[index] = {
                          ...allowances[index],
                          label: value,
                        };
                        return { ...prev, allowances };
                      })
                    }
                    disabled={loadingAllowances}
                  />
                  <PrefixInput
                    prefix={getCurrencySymbol(currencyCode)}
                    type="number"
                    label={index === 0 ? "Amount" : ""}
                    min="0"
                    step={0.01}
                    value={allowance.value}
                    onChange={(e) =>
                      setWageHistoryForm((prev) => {
                        const allowances = [...prev.allowances];
                        allowances[index] = {
                          ...allowances[index],
                          value: e.target.value,
                        };
                        return { ...prev, allowances };
                      })
                    }
                    showTypeSelector
                    valueType={allowance.type || 'amount'}
                    onTypeChange={(type) =>
                      setWageHistoryForm((prev) => {
                        const allowances = [...prev.allowances];
                        allowances[index] = {
                          ...allowances[index],
                          type,
                        };
                        return { ...prev, allowances };
                      })
                    }
                  />
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setWageHistoryForm((prev) => ({
                          ...prev,
                          allowances: prev.allowances.filter(
                            (_item, itemIndex) => itemIndex !== index,
                          ),
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No allowances added.</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
              Total Monthly Package
            </span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {(() => {
                const basic = parseFloat(wageHistoryForm.basic || "0") || 0;
                let otherVal = 0;
                if (wageHistoryForm.otherAllowance.type === 'percent') {
                  otherVal = basic * (parseFloat(wageHistoryForm.otherAllowance.value || "0") / 100);
                } else {
                  otherVal = parseFloat(wageHistoryForm.otherAllowance.value || "0") || 0;
                }
                const allowancesTotal = wageHistoryForm.allowances.reduce((acc, curr) => {
                  const val = parseFloat(curr.value || "0") || 0;
                  return acc + (curr.type === 'percent' ? (basic * (val / 100)) : val);
                }, 0);
                const total = basic + otherVal + allowancesTotal;
                return total > 0 ? getCurrencySymbol(currencyCode) + " " + total.toLocaleString() : "—";
              })()}
            </span>
          </div>
        </div>
      </EditModal>

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setContractToDelete(null);
        }}
        onConfirm={handleDelete}
        loading={isDeleting}
        description="Are you sure you want to delete this contract? This action cannot be undone."
      />

      <ConfirmDeleteModal
        isOpen={wageHistoryDeleteOpen}
        onClose={() => {
          setWageHistoryDeleteOpen(false);
          setSelectedWageHistory(null);
        }}
        onConfirm={handleWageHistoryDelete}
        loading={wageHistoryDeleting}
        title="Delete Salary History"
        description={
          selectedWageHistory
            ? `Delete salary period ${formatWagePeriod(
                selectedWageHistory.effectiveFrom,
                selectedWageHistory.effectiveTo || undefined,
                selectedWageHistory.createdAt,
              )}?`
            : "Delete this salary history?"
        }
      />

      <SeaPreviewModal
        isOpen={seaPreviewOpen}
        onClose={() => {
          setSeaPreviewOpen(false);
          setSeaPreviewApplication(null);
        }}
        application={seaPreviewApplication}
        onMarkAsSent={() => router.refresh()}
        currencySettings={currencySettings ? { currencyCode, ...currencySettings } : undefined}
      />
    </>
  );
}
