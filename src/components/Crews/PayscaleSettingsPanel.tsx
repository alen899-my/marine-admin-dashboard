"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Eye, PenBox, Plus, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import Button from "@/components/ui/button/Button";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import EditModal from "@/components/common/EditModal";
import ViewModal from "@/components/common/ViewModal";
import { getWageTotal } from "@/lib/wageHistory";
import Select from "@/components/form/Select";
import SimpleDatePicker from "@/components/form/new-datepicker";
import { Field } from "@/components/Contracts/Field";
import { PrefixInput } from "@/components/Contracts/PrefixInput";
import { getCurrencySymbol } from "@/constants/geoData";
import { formatCurrency as formatAmount } from "@/lib/formatCurrency";
import { useAllowanceDeductionOptions } from "@/hooks/useAllowanceDeductionOptions";
import type { Settings } from "@/lib/payrollVerificationAccess";

interface WageAllowance {
  label: string;
  value: number;
  type?: "amount" | "percent";
}

export interface PayscalePeriod {
  _id?: string;
  basic?: number | string;
  otherAllowance?: number | string | { value: number | string; type?: "amount" | "percent" } | null;
  allowances?: WageAllowance[];
  effectiveFrom?: string;
  effectiveTo?: string | null;
  isCurrent?: boolean;
  createdAt?: string;
}

interface PayscaleFormState {
  effectiveFrom: string;
  effectiveTo: string;
  basic: string;
  otherAllowance: { value: string; type: "amount" | "percent" };
  allowances: { label: string; value: string; type: "amount" | "percent" }[];
}

interface PayscaleContractData {
  _id?: string;
  wages?: PayscalePeriod | null;
  wagesHistory?: PayscalePeriod[];
}

interface PayscaleSettingsPanelProps {
  contract?: PayscaleContractData | null;
  canEdit: boolean;
  canDelete: boolean;
  readOnly?: boolean;
  currencyCode?: string;
  companyId?: string;
  currencySettings?: Pick<
    Settings,
    "currencyPosition" | "currencyFormatType" | "currencySpace"
  >;
}

function formatDateOnly(value?: string | null) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB");
}

const currencyCodeDefault = "USD";

function formatPayscaleValue(
  value?:
    | string
    | number
    | { value: number | string; type?: "amount" | "percent" }
    | null,
  currencyCode?: string,
  currencySettings?: Pick<
    Settings,
    "currencyPosition" | "currencyFormatType" | "currencySpace"
  >,
) {
  if (value === null || value === undefined || value === "") return "-";

  let amount: number;
  let type: "amount" | "percent" = "amount";

  if (typeof value === "object" && value !== null) {
    amount = Number(value.value);
    type = value.type || "amount";
  } else {
    amount = Number(value);
  }

  if (!Number.isFinite(amount)) return "-";

  if (type === "percent") {
    return `${amount}%`;
  }

  return formatAmount(amount, currencyCode ?? currencyCodeDefault, {
    position: currencySettings?.currencyPosition,
    formatType: currencySettings?.currencyFormatType,
    showSpace: currencySettings?.currencySpace,
  });
}

function formatPayscalePeriod(period?: PayscalePeriod | null) {
  if (!period) return "Effective date not set";

  const fromSource = period.effectiveFrom || period.createdAt;
  if (!fromSource) return "Effective date not set";

  return `${formatDateOnly(fromSource)} to ${
    period.effectiveTo ? formatDateOnly(period.effectiveTo) : "Present"
  }`;
}

function createPayscaleForm(period?: PayscalePeriod | null): PayscaleFormState {
  let otherAllowance: { value: string; type: "amount" | "percent" } = {
    value: "",
    type: "amount",
  };

  if (period?.otherAllowance !== undefined && period?.otherAllowance !== null) {
    if (typeof period.otherAllowance === "object" && period.otherAllowance !== null) {
      otherAllowance = {
        value: String(period.otherAllowance.value || ""),
        type: period.otherAllowance.type || "amount",
      };
    } else {
      otherAllowance = {
        value: String(period.otherAllowance),
        type: "amount",
      };
    }
  }

  return {
    effectiveFrom: period?.effectiveFrom
      ? String(period.effectiveFrom).split("T")[0]
      : "",
    effectiveTo: period?.effectiveTo
      ? String(period.effectiveTo).split("T")[0]
      : "",
    basic:
      period?.basic !== undefined && period?.basic !== null
        ? String(period.basic)
        : "",
    otherAllowance,
    allowances: Array.isArray(period?.allowances)
      ? period.allowances.map((allowance) => ({
          label: String(allowance.label || ""),
          value:
            allowance.value !== undefined && allowance.value !== null
              ? String(allowance.value)
              : "",
          type: allowance.type || "amount",
        }))
      : [],
  };
}

function getDuplicateAllowanceMessage(
  allowances: { label: string; value: string; type: "amount" | "percent" }[],
) {
  const seen = new Set<string>();

  for (const allowance of allowances) {
    const label = allowance.label.trim();
    if (!label) continue;

    const normalized = label.toLowerCase();
    if (seen.has(normalized)) {
      return `${label} cannot be added more than once.`;
    }

    seen.add(normalized);
  }

  return "";
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-gray-400">
      {message}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-gray-100 last:border-b-0 dark:border-white/10">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900 dark:text-white">
        {value}
      </span>
    </div>
  );
}

function AllowanceEntrySection({
  allowances,
  currencyCode,
  currencySymbol,
  allowanceOptions,
  loadingAllowances,
  disabled,
  onAdd,
  onChange,
  onRemove,
}: {
  allowances: PayscaleFormState["allowances"];
  currencyCode: string;
  currencySymbol: string;
  allowanceOptions: { value: string; label: string }[];
  loadingAllowances: boolean;
  disabled: boolean;
  onAdd: () => void;
  onChange: (
    index: number,
    field: "label" | "value" | "type",
    value: string,
  ) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Allowances
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Add active allowance masters for this payscale period.
          </p>
        </div>
        <Button
          type="button"
          variant="link"
          className="text-xs sm:text-sm font-medium"
          onClick={onAdd}
          disabled={disabled}
        >
          + Add Allowance
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {allowances.length ? (
          allowances.map((allowance, index) => (
            <div
              key={`payscale-allowance-${index}`}
              className="flex items-end gap-2 sm:gap-3"
            >
              <div className="flex-1 min-w-0">
                <Field label={index === 0 ? "Name" : " "} required={index === 0}>
                  <Select
                    options={allowanceOptions}
                    placeholder={
                      loadingAllowances ? "Loading..." : "Select allowance"
                    }
                    value={allowance.label}
                    onChange={(value) => onChange(index, "label", value)}
                    disabled={disabled || loadingAllowances}
                  />
                </Field>
              </div>

              <div className="flex-1 min-w-0">
                <Field
                  label={index === 0 ? `Amount (${currencyCode})` : " "}
                >
                  <PrefixInput
                    prefix={currencySymbol}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Amount"
                    value={allowance.value}
                    onChange={(e) => onChange(index, "value", e.target.value)}
                    showTypeSelector
                    valueType={allowance.type}
                    onTypeChange={(type) => onChange(index, "type", type)}
                    disabled={disabled}
                  />
                </Field>
              </div>

              <button
                type="button"
                title="Remove allowance"
                onClick={() => onRemove(index)}
                className="mb-1.5 rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-500/10"
                disabled={disabled}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))
        ) : (
          <p className="py-2 text-center text-xs italic text-gray-400">
            No allowances added.
          </p>
        )}
      </div>
    </div>
  );
}

export default function PayscaleSettingsPanel({
  contract,
  canEdit,
  canDelete,
  readOnly = false,
  currencyCode = "USD",
  companyId,
  currencySettings,
}: PayscaleSettingsPanelProps) {
  const currencySymbol = getCurrencySymbol(currencyCode);
  const { options: allowanceOptions, loading: loadingAllowances } =
    useAllowanceDeductionOptions("allowance", companyId);
  const router = useRouter();
  const contractId = contract?._id;
  const wageHistory = Array.isArray(contract?.wagesHistory)
    ? contract.wagesHistory
    : [];
  const currentPayscale = contract?.wages || wageHistory[0] || null;

  const [selectedPeriod, setSelectedPeriod] = useState<PayscalePeriod | null>(
    null,
  );
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<PayscaleFormState>(createPayscaleForm());

  if (!contractId) {
    return (
      <EmptyState message="Create contract details first to configure payscale periods for this crew member." />
    );
  }

  const openCreateModal = () => {
    setSelectedPeriod(null);
    setForm(createPayscaleForm());
    setFormError("");
    setFormMode("create");
  };

  const openEditModal = (period: PayscalePeriod) => {
    setSelectedPeriod(period);
    setForm(createPayscaleForm(period));
    setFormError("");
    setFormMode("edit");
  };

  const validateForm = () => {
    if (!form.effectiveFrom) {
      setFormError("Effective from date is required.");
      return false;
    }

    if (
      form.effectiveTo &&
      new Date(form.effectiveTo).getTime() <
        new Date(form.effectiveFrom).getTime()
    ) {
      setFormError("Effective end date cannot be before the start date.");
      return false;
    }

    const duplicateAllowanceMessage = getDuplicateAllowanceMessage(
      form.allowances,
    );
    if (duplicateAllowanceMessage) {
      setFormError(duplicateAllowanceMessage);
      return false;
    }

    setFormError("");
    return true;
  };

  const buildPayload = () => ({
    effectiveFrom: form.effectiveFrom,
    effectiveTo: form.effectiveTo || null,
    basic: Number(form.basic) || 0,
    otherAllowance: {
      value: Number(form.otherAllowance.value) || 0,
      type: form.otherAllowance.type,
    },
    allowances: form.allowances
      .map((allowance) => ({
        label: allowance.label.trim(),
        value: Number(allowance.value) || 0,
        type: allowance.type,
      }))
      .filter((allowance) => allowance.label),
  });

  const handleSave = async () => {
    if (!validateForm()) return;

    const isEdit = formMode === "edit";
    const selectedPeriodId = selectedPeriod?._id;
    if (!contractId || !formMode || (isEdit && !selectedPeriodId)) return;

    setFormSaving(true);
    try {
      const endpoint = isEdit
        ? `/api/contracts/${contractId}/wages/${selectedPeriodId}`
        : `/api/contracts/${contractId}/wages`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save payscale period");
      }

      toast.success(
        isEdit ? "Payscale period updated" : "Payscale period added",
      );
      setFormMode(null);
      setSelectedPeriod(null);
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save payscale period",
      );
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!contractId || !selectedPeriod?._id) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(
        `/api/contracts/${contractId}/wages/${selectedPeriod._id}`,
        { method: "DELETE" },
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete payscale period");
      }

      toast.success("Payscale period deleted");
      setDeleteOpen(false);
      setViewOpen(false);
      setSelectedPeriod(null);
      router.refresh();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete payscale period",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAllowanceChange = (
    index: number,
    field: "label" | "value" | "type",
    value: string,
  ) => {
    setForm((prev) => {
      const allowances = [...prev.allowances];
      allowances[index] = {
        ...allowances[index],
        [field]: value,
      };

      return { ...prev, allowances };
    });
  };

  const handleAddAllowance = () => {
    setForm((prev) => ({
      ...prev,
      allowances: [
        ...prev.allowances,
        { label: "", value: "", type: "amount" },
      ],
    }));
  };

  const handleRemoveAllowance = (index: number) => {
    setForm((prev) => ({
      ...prev,
      allowances: prev.allowances.filter(
        (_item, itemIndex) => itemIndex !== index,
      ),
    }));
  };

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  Current Payscale
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Active package and allowance breakdown for this crew member.
                </p>
              </div>
              <div className="rounded-2xl bg-brand-50 p-3 text-brand-500 dark:bg-brand-500/10 dark:text-brand-300">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>

            {currentPayscale ? (
              <div className="mt-5">
                <SummaryRow
                  label="Effective Period"
                  value={formatPayscalePeriod(currentPayscale)}
                />
                <SummaryRow
                  label="Basic Wages"
                  value={formatPayscaleValue(
                    currentPayscale.basic,
                    currencyCode,
                    currencySettings,
                  )}
                />
                <SummaryRow
                  label="Other Allowance"
                  value={formatPayscaleValue(
                    currentPayscale.otherAllowance,
                    currencyCode,
                    currencySettings,
                  )}
                />
                {(currentPayscale.allowances || []).map((allowance, index) => (
                  <SummaryRow
                    key={`${allowance.label || "allowance"}-${index}`}
                    label={allowance.label || `Allowance ${index + 1}`}
                    value={formatPayscaleValue(
                      allowance,
                      currencyCode,
                      currencySettings,
                    )}
                  />
                ))}
                <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-500/10">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                    Total Monthly Package
                  </div>
                  <div className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {formatPayscaleValue(
                      getWageTotal(currentPayscale),
                      currencyCode,
                      currencySettings,
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState message="No payscale period has been configured yet." />
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  Payscale Periods
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {readOnly
                    ? "Review each wage period configured for this crew member."
                    : "Review each wage period and manage history without changing contract details."}
                </p>
              </div>
              {!readOnly && canEdit ? (
                <Button
                  size="sm"
                  startIcon={<Plus className="h-4 w-4" />}
                  onClick={openCreateModal}
                >
                  Add Period
                </Button>
              ) : null}
            </div>

            <div className="mt-5 space-y-3">
              {wageHistory.length ? (
                wageHistory.map((period, index) => {
                  return (
                    <div
                      key={
                        period._id ||
                        `${period.effectiveFrom || "period"}-${index}`
                      }
                      className="rounded-2xl border border-gray-200 p-4 dark:border-white/10"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatPayscalePeriod(period)}
                          </p>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Basic{" "}
                            {formatPayscaleValue(
                              period.basic,
                              currencyCode,
                              currencySettings,
                            )}{" "}
                            · Package{" "}
                            {formatPayscaleValue(
                              getWageTotal(period),
                              currencyCode,
                              currencySettings,
                            )}
                          </p>
                        </div>

                        <div className="flex flex-col items-start gap-2 sm:items-end mt-1">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPeriod(period);
                                setViewOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 text-blue-500" />
                            </Button>
                            {!readOnly && canEdit ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(period)}
                              >
                                <PenBox className="h-4 w-4 text-yellow-500" />
                              </Button>
                            ) : null}
                            {!readOnly && canDelete ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPeriod(period);
                                  setDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState message="No payscale periods are available for this contract." />
              )}
            </div>
          </section>
        </div>
      </div>

      <ViewModal
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setSelectedPeriod(null);
        }}
        title="Payscale Period Details"
        size="md"
      >
        {!selectedPeriod ? null : (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Effective Period
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                {formatPayscalePeriod(selectedPeriod)}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Basic
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  {formatPayscaleValue(
                    selectedPeriod.basic,
                    currencyCode,
                    currencySettings,
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Other Allowance
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  {formatPayscaleValue(
                    selectedPeriod.otherAllowance,
                    currencyCode,
                    currencySettings,
                  )}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-3 dark:border-white/10">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Allowances
              </p>
              <div className="mt-2 space-y-2">
                {selectedPeriod.allowances?.length ? (
                  selectedPeriod.allowances.map((allowance, index) => (
                    <div
                      key={`${allowance.label || "allowance"}-${index}`}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span>{allowance.label || `Allowance ${index + 1}`}</span>
                      <span>
                        {formatPayscaleValue(
                          allowance,
                          currencyCode,
                          currencySettings,
                        )}
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
                {formatPayscaleValue(
                  getWageTotal(selectedPeriod),
                  currencyCode,
                  currencySettings,
                )}
              </p>
            </div>
          </div>
        )}
      </ViewModal>

      <EditModal
        isOpen={formMode !== null}
        onClose={() => {
          setFormMode(null);
          setSelectedPeriod(null);
          setFormError("");
        }}
        title={
          formMode === "create" ? "Add Payscale Period" : "Edit Payscale Period"
        }
        onSubmit={handleSave}
        loading={formSaving}
      >
        <div className="space-y-5">
          {formError ? (
            <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
              {formError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SimpleDatePicker
              label="Salary Effective From *"
              value={form.effectiveFrom}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, effectiveFrom: value }))
              }
            />
            <SimpleDatePicker
              label="Salary Effective End Date"
              value={form.effectiveTo}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, effectiveTo: value }))
              }
            />
            <Field label={`Basic Wages (${currencyCode}/month)`} required>
              <PrefixInput
                prefix={currencySymbol}
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 2500"
                value={form.basic}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, basic: e.target.value }))
                }
              />
            </Field>
            <Field label={`Other Allowance (${currencyCode}/month)`}>
              <PrefixInput
                prefix={currencySymbol}
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 200"
                value={form.otherAllowance.value}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    otherAllowance: { ...prev.otherAllowance, value: e.target.value },
                  }))
                }
                showTypeSelector
                valueType={form.otherAllowance.type}
                onTypeChange={(type) =>
                  setForm((prev) => ({
                    ...prev,
                    otherAllowance: { ...prev.otherAllowance, type },
                  }))
                }
              />
            </Field>
          </div>

          <AllowanceEntrySection
            allowances={form.allowances}
            currencyCode={currencyCode}
            currencySymbol={currencySymbol}
            allowanceOptions={allowanceOptions}
            loadingAllowances={loadingAllowances}
            disabled={formSaving}
            onAdd={handleAddAllowance}
            onChange={handleAllowanceChange}
            onRemove={handleRemoveAllowance}
          />
        </div>
      </EditModal>

      <ConfirmDeleteModal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedPeriod(null);
        }}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Payscale Period"
        description={
          selectedPeriod
            ? `Delete payscale period ${formatPayscalePeriod(selectedPeriod)}?`
            : "Delete this payscale period?"
        }
      />
    </>
  );
}
