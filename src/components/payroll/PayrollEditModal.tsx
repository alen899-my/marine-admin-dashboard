"use client";

import { useEffect, useMemo, useState } from "react";
import AddForm from "@/components/common/AddForm";
import Avatar from "@/components/ui/avatar/Avatar";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import {
  PayrollEditableFields,
  PayrollLeaveTypeOption,
  PayrollRow,
} from "@/lib/payroll";
import { formatCurrency } from "@/lib/formatCurrency";
import { PrefixInput } from "@/components/Contracts/PrefixInput";
import { getCurrencySymbol } from "@/constants/geoData";
import { useAllowanceDeductionOptions } from "@/hooks/useAllowanceDeductionOptions";
import { AlertTriangle, X } from "lucide-react";

interface PayrollEditModalProps {
  currencyCode?: string;
  currencySettings?: {
    currencyPosition: "left" | "right";
    currencyFormatType: "symbol" | "code";
    currencySpace: boolean;
  };
  leaveTypes: PayrollLeaveTypeOption[];
  row: PayrollRow | null;
  isOpen: boolean;
  loading?: boolean;
  currentIndex?: number;
  totalCount?: number;
  nextCrewName?: string | null;
  errors?: Record<string, string>;
  descriptionError?: boolean;
  onClose: () => void;
  onSave: (
    values: PayrollEditableFields,
    options: { moveNext: boolean },
  ) => Promise<void> | void;
}

function toInputValue(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function toFormValues(
  row: PayrollRow | null,
  leaveTypes: PayrollLeaveTypeOption[],
) {
  return {
    leaveEntries: leaveTypes.map((leaveType) => {
      const existingEntry = row?.leaveEntries.find(
        (entry) => entry.leaveTypeId === leaveType.id,
      );

      return {
        leaveTypeId: leaveType.id,
        leaveTypeCode: leaveType.code,
        leaveTypeName: leaveType.name,
        leaveTypeMaxDays: existingEntry?.leaveTypeMaxDays ?? leaveType.maxDays,
        status: existingEntry?.status === "pending" ? "pending" : "saved",
        days:
          existingEntry?.days === null || existingEntry?.days === undefined
            ? ""
            : String(existingEntry.days),
        approvedDays:
          existingEntry?.approvedDays === null ||
          existingEntry?.approvedDays === undefined
            ? String(existingEntry?.leaveTypeMaxDays ?? leaveType.maxDays)
            : String(existingEntry.approvedDays),
      };
    }),
    crewAllowances: (row?.crewAllowances || []).map((entry) => ({
      label: entry.label,
      value: toInputValue(entry.value),
      type: entry.type || "amount",
    })),
    crewDeductions: (row?.crewDeductions || []).map((entry) => ({
      label: entry.label,
      value: toInputValue(entry.value),
      type: entry.type || "amount",
    })),
    remarks: row?.remarks || "",
  };
}

function mergeEntryOptions(
  options: { value: string; label: string }[],
  entries: { label: string }[],
) {
  const optionMap = new Map(options.map((option) => [option.value, option.label]));

  entries.forEach((entry) => {
    const label = entry.label.trim();
    if (label && !optionMap.has(label)) {
      optionMap.set(label, label);
    }
  });

  return Array.from(optionMap, ([value, label]) => ({ value, label }));
}

interface PayrollEntrySectionProps {
  title: string;
  description: string;
  addLabel: string;
  emptyLabel: string;
  fieldKey: "crewAllowances" | "crewDeductions";
  entries: { label: string; value: string; type?: "amount" | "percent" }[];
  options: { value: string; label: string }[];
  loading: boolean;
  errors: Record<string, string>;
  currencySymbol: string;
  onAdd: () => void;
  onEntryChange: (
    index: number,
    field: "label" | "value" | "type",
    value: string,
  ) => void;
  onRemove: (index: number) => void;
}

function PayrollEntrySection({
  title,
  description,
  addLabel,
  emptyLabel,
  fieldKey,
  entries,
  options,
  loading,
  errors,
  currencySymbol,
  onAdd,
  onEntryChange,
  onRemove,
}: PayrollEntrySectionProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </h5>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>

        <Button
          type="button"
          variant="link"
          className="shrink-0 text-xs sm:text-sm font-medium"
          onClick={onAdd}
        >
          {addLabel}
        </Button>
      </div>

      <div className="space-y-3">
        {entries.length ? (
          entries.map((entry, index) => (
            <div
              key={`${fieldKey}-${index}`}
              className="flex items-end gap-2 sm:gap-3"
            >
              <div className="flex-1 min-w-0">
                <Label>
                  {index === 0 ? "Name *" : <span className="opacity-0">Name *</span>}
                </Label>
                <Select
                  options={options}
                  placeholder={loading ? "Loading..." : "Select entry"}
                  value={entry.label}
                  onChange={(value) => onEntryChange(index, "label", value)}
                  disabled={loading}
                  error={Boolean(errors[`${fieldKey}.${index}.label`])}
                  hint={errors[`${fieldKey}.${index}.label`]}
                />
              </div>

              <div className="flex-1 min-w-0">
                <Label>
                  {index === 0 ? (
                    `Amount (${currencySymbol})`
                  ) : (
                    <span className="opacity-0">Amount ({currencySymbol})</span>
                  )}
                </Label>
                <PrefixInput
                  prefix={currencySymbol}
                  type="number"
                  min="0"
                  step={0.01}
                  placeholder="Amount"
                  value={entry.value}
                  onChange={(e) => onEntryChange(index, "value", e.target.value)}
                  showTypeSelector
                  valueType={entry.type}
                  onTypeChange={(type) => onEntryChange(index, "type", type)}
                  error={Boolean(errors[`${fieldKey}.${index}.value`])}
                  hint={errors[`${fieldKey}.${index}.value`]}
                />
              </div>

              <button
                type="button"
                title={`Remove ${title.toLowerCase()}`}
                onClick={() => onRemove(index)}
                className="p-2 my-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))
        ) : (
          <p className="py-2 text-sm text-gray-500">{emptyLabel}</p>
        )}
      </div>
    </section>
  );
}

export default function PayrollEditModal({
  leaveTypes,
  row,
  isOpen,
  loading = false,
  currentIndex = 0,
  totalCount = 0,
  nextCrewName,
  errors = {},
  descriptionError,
  onClose,
  onSave,
  currencyCode = "USD",
  currencySettings,
}: PayrollEditModalProps) {
  const currencySymbol = getCurrencySymbol(currencyCode);
  const { options: allowanceOptions, loading: loadingAllowances } =
    useAllowanceDeductionOptions("allowance", row?.companyId);
  const { options: deductionOptions, loading: loadingDeductions } =
    useAllowanceDeductionOptions("deduction", row?.companyId);
  const [formData, setFormData] = useState(toFormValues(row, leaveTypes));
  const isFinanceApproved = row?.status === "finance_approved";
  const amountTextClass = isFinanceApproved
    ? "text-gray-900 dark:text-white"
    : "text-gray-400 dark:text-gray-500";
  const netPayableTextClass = isFinanceApproved
    ? "text-success-600 dark:text-success-400"
    : "text-gray-400 dark:text-gray-500";

  useEffect(() => {
    setFormData(toFormValues(row, leaveTypes));
  }, [row, isOpen, leaveTypes]);

  const mergedAllowanceOptions = useMemo(
    () => mergeEntryOptions(allowanceOptions, formData.crewAllowances),
    [allowanceOptions, formData.crewAllowances],
  );
  const mergedDeductionOptions = useMemo(
    () => mergeEntryOptions(deductionOptions, formData.crewDeductions),
    [deductionOptions, formData.crewDeductions],
  );

  const description = useMemo(() => {
    const progressLabel =
      totalCount > 0 ? `Employee ${currentIndex + 1} of ${totalCount}` : null;
    const nextLabel = nextCrewName ? `Next: ${nextCrewName}` : null;

    return [progressLabel, nextLabel].filter(Boolean).join(" • ");
  }, [currentIndex, nextCrewName, totalCount]);

  const getPayload = () => ({
    leaveEntries: formData.leaveEntries.map((entry) => {
      const daysValue = entry.days === "" ? null : Number(entry.days);
      const approvedValue =
        entry.approvedDays === ""
          ? entry.leaveTypeMaxDays
          : Number(entry.approvedDays);

      return {
        leaveTypeId: entry.leaveTypeId,
        leaveTypeCode: entry.leaveTypeCode,
        leaveTypeName: entry.leaveTypeName,
        leaveTypeMaxDays: entry.leaveTypeMaxDays,
        status: entry.status === "pending" ? "pending" : "saved",
        days: daysValue,
        approvedDays:
          daysValue === null
            ? approvedValue
            : Math.min(daysValue, approvedValue),
      };
    }),
    crewAllowances: formData.crewAllowances
      .map((entry) => ({
        label: entry.label.trim(),
        value: entry.value.trim() === "" ? null : Number(entry.value),
        type: entry.type || "amount",
      }))
      .filter((entry) => entry.label || entry.value !== null),
    crewDeductions: formData.crewDeductions
      .map((entry) => ({
        label: entry.label.trim(),
        value: entry.value.trim() === "" ? null : Number(entry.value),
        type: entry.type || "amount",
      }))
      .filter((entry) => entry.label || entry.value !== null),
    bondedStore: null,
    cashAdvance: null,
    telDeduction: null,
    otherDeductions: null,
    remarks: formData.remarks.trim(),
  });

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleCrewAllowanceChange = (
    index: number,
    field: "label" | "value" | "type",
    value: string,
  ) => {
    setFormData((prev) => {
      const crewAllowances = [...prev.crewAllowances];
      crewAllowances[index] = {
        ...crewAllowances[index],
        [field]: value,
      };

      return { ...prev, crewAllowances };
    });
  };

  const handleCrewDeductionChange = (
    index: number,
    field: "label" | "value" | "type",
    value: string,
  ) => {
    setFormData((prev) => {
      const crewDeductions = [...prev.crewDeductions];
      crewDeductions[index] = {
        ...crewDeductions[index],
        [field]: value,
      };

      return { ...prev, crewDeductions };
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : handleClose}
      className="w-full max-w-[95vw] md:max-w-[900px] p-4 sm:p-6"
    >
      <AddForm
        title={row ? `Payroll Inputs: ${row.crewName}` : "Payroll Inputs"}
        description={
          description ||
          "Add leave, allowance, and deduction values for this crew member."
        }
        descriptionError={descriptionError}
        onCancel={handleClose}
        onSubmit={() => onSave(getPayload() as PayrollEditableFields, { moveNext: false })}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onSave(getPayload() as PayrollEditableFields, {
                  moveNext: false,
                })
              }
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              onClick={() =>
                onSave(getPayload() as PayrollEditableFields, {
                  moveNext: true,
                })
              }
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : nextCrewName
                  ? "Save and Next"
                  : "Save and Finish"}
            </Button>
          </>
        }
      >
        <div className="max-h-[70dvh] space-y-5 overflow-y-auto p-1">
          {row ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Avatar + Crew Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={row.profilePhoto ?? undefined}
                    name={row.crewName}
                    size="large"
                    status="none"
                  />
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                      {row.crewName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {row.rank || "No rank"} • {row.vesselName || "No vessel"}
                    </p>
                  </div>
                </div>
                {/* Wages Summary */}
                <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-[260px]">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">
                      Gross Wages
                    </p>
                    <p className={`font-semibold ${amountTextClass}`}>
                      {formatCurrency(row.grossWages, currencyCode || "USD", { currencySettings })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">
                      Net Payable
                    </p>
                    <p className={`font-semibold ${netPayableTextClass}`}>
                      {formatCurrency(row.netPayable, currencyCode || "USD", { currencySettings })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.02]">
            <div className="mb-4">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                Leave Entries
              </h5>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Fill all leave values here instead of inline table inputs.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {formData.leaveEntries.length ? (
                formData.leaveEntries.map((entry) => (
                  <div
                    key={entry.leaveTypeId}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-gray-900/40"
                  >
                    {(() => {
                      const daysValue =
                        entry.days === "" ? 0 : Number(entry.days);
                      const approvedValue =
                        entry.approvedDays === ""
                          ? entry.leaveTypeMaxDays
                          : Number(entry.approvedDays);
                      const clampedApprovedValue = Math.min(
                        daysValue,
                        approvedValue,
                      );
                      const cutDays = Math.max(
                        0,
                        daysValue - clampedApprovedValue,
                      );

                      return (
                        <>
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                                {entry.leaveTypeName}
                              </p>
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-gray-500 dark:text-gray-400">
                                  Policy paid days: {entry.leaveTypeMaxDays}
                                </span>
                                {daysValue > entry.leaveTypeMaxDays && (
                                  <span className="flex items-center gap-1 font-medium text-warning-500 dark:text-warning-400">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Exceeds  limit
                                  </span>
                                )}
                              </div>
                            </div>
                            <Checkbox
                              id={`leave-pending-${entry.leaveTypeId}`}
                              label="Pending"
                              checked={entry.status === "pending"}
                              onChange={(checked) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  leaveEntries: prev.leaveEntries.map((item) =>
                                    item.leaveTypeId === entry.leaveTypeId
                                      ? {
                                          ...item,
                                          status: checked ? "pending" : "saved",
                                        }
                                      : item,
                                  ),
                                }))
                              }
                            />
                          </div>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <Input
                              type="number"
                              label="Leave Days *"
                              min="0"
                              step={0.5}
                              value={entry.days}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  leaveEntries: prev.leaveEntries.map(
                                    (item) => {
                                      if (
                                        item.leaveTypeId !== entry.leaveTypeId
                                      ) {
                                        return item;
                                      }

                                      const nextDays = e.target.value;
                                      if (nextDays === "") {
                                        return { ...item, days: nextDays };
                                      }

                                      const nextDaysNumber = Number(nextDays);
                                      const currentApproved =
                                        item.approvedDays === ""
                                          ? item.leaveTypeMaxDays
                                          : Number(item.approvedDays);

                                      return {
                                        ...item,
                                        days: nextDays,
                                        approvedDays: String(
                                          Math.min(
                                            nextDaysNumber,
                                            currentApproved,
                                          ),
                                        ),
                                      };
                                    },
                                  ),
                                }))
                              }
                              error={Boolean(
                                errors[`leave.${entry.leaveTypeId}`],
                              )}
                              hint={errors[`leave.${entry.leaveTypeId}`]}
                            />
                            <Input
                              type="number"
                              label="Approved Paid Days"
                              min="0"
                              step={0.5}
                              value={entry.approvedDays}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  leaveEntries: prev.leaveEntries.map(
                                    (item) => {
                                      if (
                                        item.leaveTypeId !== entry.leaveTypeId
                                      ) {
                                        return item;
                                      }

                                      const nextApproved = e.target.value;
                                      if (nextApproved === "") {
                                        return {
                                          ...item,
                                          approvedDays: nextApproved,
                                        };
                                      }

                                      const daysForLeave =
                                        item.days === ""
                                          ? Number(nextApproved)
                                          : Number(item.days);

                                      return {
                                        ...item,
                                        approvedDays: String(
                                          Math.min(
                                            daysForLeave,
                                            Number(nextApproved),
                                          ),
                                        ),
                                      };
                                    },
                                  ),
                                }))
                              }
                            />
                          </div>
                          <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 dark:border-white/10 dark:bg-white/[0.02] dark:text-gray-300">
                            <div className="flex items-center justify-between gap-3">
                              <span>Approved without salary cut</span>
                              <span className="font-semibold">
                                {clampedApprovedValue} day(s)
                              </span>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-3">
                              <span>Days still deducted</span>
                              <span
                                className={`font-semibold ${
                                  cutDays > 0
                                    ? "text-error-600 dark:text-error-400"
                                    : "text-success-600 dark:text-success-400"
                                }`}
                              >
                                {cutDays} day(s)
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No leave types available.
                </p>
              )}
            </div>
          </section>

          <PayrollEntrySection
            title="Crew Allowances"
            description="Enter allowance amounts from the active allowance master."
            addLabel="+ Add Allowance"
            emptyLabel={
              loadingAllowances
                ? "Loading allowances..."
                : "No allowances added."
            }
            fieldKey="crewAllowances"
            entries={formData.crewAllowances}
            options={mergedAllowanceOptions}
            loading={loadingAllowances}
            errors={errors}
            currencySymbol={currencySymbol}
            onAdd={() =>
              setFormData((prev) => ({
                ...prev,
                crewAllowances: [
                  ...prev.crewAllowances,
                  { label: "", value: "", type: "amount" },
                ],
              }))
            }
            onEntryChange={handleCrewAllowanceChange}
            onRemove={(index) =>
              setFormData((prev) => ({
                ...prev,
                crewAllowances: prev.crewAllowances.filter((_, i) => i !== index),
              }))
            }
          />

          <PayrollEntrySection
            title="Crew Deductions"
            description="Enter deduction amounts from the active deduction master."
            addLabel="+ Add Deduction"
            emptyLabel={
              loadingDeductions
                ? "Loading deductions..."
                : "No deductions added."
            }
            fieldKey="crewDeductions"
            entries={formData.crewDeductions}
            options={mergedDeductionOptions}
            loading={loadingDeductions}
            errors={errors}
            currencySymbol={currencySymbol}
            onAdd={() =>
              setFormData((prev) => ({
                ...prev,
                crewDeductions: [
                  ...prev.crewDeductions,
                  { label: "", value: "", type: "amount" },
                ],
              }))
            }
            onEntryChange={handleCrewDeductionChange}
            onRemove={(index) =>
              setFormData((prev) => ({
                ...prev,
                crewDeductions: prev.crewDeductions.filter((_, i) => i !== index),
              }))
            }
          />

          <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.02]">
            <label className="mb-1.5 ml-1 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Remarks
            </label>
            <TextArea
              rows={4}
              value={formData.remarks}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, remarks: e.target.value }))
              }
              placeholder="Optional payroll notes"
            />
          </section>
        </div>
      </AddForm>
    </Modal>
  );
}
