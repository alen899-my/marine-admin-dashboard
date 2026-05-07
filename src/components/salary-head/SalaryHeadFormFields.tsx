"use client";

import ComponentCard from "@/components/common/ComponentCard";
import SimpleDatePicker from "@/components/form/new-datepicker";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import { PrefixInput } from "@/components/Contracts/PrefixInput";
import Button from "@/components/ui/button/Button";
import {
  computeSalaryHeadAllowanceTotal,
  computeSalaryHeadDeductions,
  SalaryHeadFormDeduction,
  SalaryHeadFormAllowance,
  SalaryHeadFormValues,
} from "@/lib/salaryHead";
import { getCurrencySymbol } from "@/constants/geoData";
import { useAllowanceDeductionOptions } from "@/hooks/useAllowanceDeductionOptions";
import { X } from "lucide-react";

interface SalaryHeadFormFieldsProps {
  formData: SalaryHeadFormValues;
  errors: Record<string, string>;
  disabled?: boolean;
  showStatus?: boolean;
  currencyCode?: string;
  isSuperAdmin?: boolean;
  companyOptions?: { value: string; label: string }[];
  onFieldChange: (field: keyof SalaryHeadFormValues, value: string) => void;
  onAllowanceChange: (
    index: number,
    field: "label" | "value" | "type",
    value: string,
  ) => void;
  onAddAllowance: () => void;
  onRemoveAllowance: (index: number) => void;
  onDeductionChange: (
    index: number,
    field: "label" | "value" | "type",
    value: string,
  ) => void;
  onAddDeduction: () => void;
  onRemoveDeduction: (index: number) => void;
}

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-500 mt-1">{message}</p>;
}

interface EntrySectionProps {
  title: string;
  addLabel: string;
  emptyLabel: string;
  tone: "allowance" | "deduction";
  entries: SalaryHeadFormAllowance[] | SalaryHeadFormDeduction[];
  errors: Record<string, string>;
  disabled: boolean;
  fieldKey: "allowances" | "deductions";
  namePlaceholder: string;
  amountPlaceholder: string;
  currencySymbol?: string;
  nameOptions: { value: string; label: string }[];
  loadingNames?: boolean;
  onEntryChange: (
    index: number,
    field: "label" | "value" | "type",
    value: string,
  ) => void;
  onAddEntry: () => void;
  onRemoveEntry: (index: number) => void;
}

const toneClasses = {
  allowance: {
    wrapper:
      "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10",
    label: "text-emerald-700 dark:text-emerald-400",
    value: "text-emerald-600 dark:text-emerald-400",
  },
  deduction: {
    wrapper:
      "border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10",
    label: "text-rose-700 dark:text-rose-400",
    value: "text-rose-600 dark:text-rose-400",
  },
} as const;

function EntrySection({
  title,
  addLabel,
  emptyLabel,
  tone,
  entries,
  errors,
  disabled,
  fieldKey,
  namePlaceholder,
  amountPlaceholder,
  currencySymbol = "$",
  nameOptions,
  loadingNames = false,
  onEntryChange,
  onAddEntry,
  onRemoveEntry,
}: EntrySectionProps) {
  const colors = toneClasses[tone];

  return (
    <ComponentCard title={title}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm sm:text-md font-semibold text-gray-700 dark:text-gray-300">
            {title} Entries
          </label>
          <Button
            variant="link"
            onClick={onAddEntry}
            className="text-xs sm:text-sm font-medium"
            disabled={disabled}
          >
            {addLabel}
          </Button>
        </div>

        <div className="space-y-3 pr-0.5">
          {entries.map((entry, index) => (
            <div
              key={`${fieldKey}-${index}`}
              className="flex items-end gap-2 sm:gap-3"
            >
              <div className="flex-1 min-w-0">
                <Label>
                  {index === 0 ? (
                    "Name"
                  ) : (
                    <span className="opacity-0">Name</span>
                  )}
                </Label>
                <Select
                  options={nameOptions}
                  placeholder={loadingNames ? "Loading..." : namePlaceholder}
                  value={entry.label}
                  onChange={(value) => onEntryChange(index, "label", value)}
                  disabled={disabled || loadingNames}
                />
                <ErrorText message={errors[`${fieldKey}.${index}.label`]} />
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
                  placeholder={amountPlaceholder}
                  value={entry.value}
                  onChange={(e) =>
                    onEntryChange(index, "value", e.target.value)
                  }
                  showTypeSelector
                  valueType={entry.type}
                  onTypeChange={(type) => onEntryChange(index, "type", type)}
                  disabled={disabled}
                />
                <ErrorText message={errors[`${fieldKey}.${index}.value`]} />
              </div>

              <button
                type="button"
                title={`Remove ${tone}`}
                onClick={() => onRemoveEntry(index)}
                className="p-2 my-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg shrink-0"
                disabled={disabled}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}

          {entries.length === 0 && (
            <p className="text-xs text-center text-gray-400 italic py-2">
              {emptyLabel}
            </p>
          )}
        </div>

      </div>
    </ComponentCard>
  );
}

export default function SalaryHeadFormFields({
  formData,
  errors,
  disabled = false,
  showStatus = true,
  currencyCode = "USD",
  onFieldChange,
  onAllowanceChange,
  onAddAllowance,
  onRemoveAllowance,
  onDeductionChange,
  onAddDeduction,
  onRemoveDeduction,
  isSuperAdmin = false,
  companyOptions = [],
}: SalaryHeadFormFieldsProps) {
  const currencySymbol = getCurrencySymbol(currencyCode);
  const { options: allowanceOptions, loading: loadingAllowances } =
    useAllowanceDeductionOptions("allowance", formData.companyId);
  const { options: deductionOptions, loading: loadingDeductions } =
    useAllowanceDeductionOptions("deduction", formData.companyId);


  return (
    <div className="space-y-5">
      <ComponentCard title="Salary Head Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-1">
            <Label>
              Salary Head Title <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => onFieldChange("title", e.target.value)}
              disabled={disabled}
              placeholder="e.g. Senior Officer Salary Head"
              error={!!errors.title}
              hint={errors.title}
            />
          </div>

          {isSuperAdmin && (
            <div className="md:col-span-1">
              <Label>
                Company <span className="text-red-500">*</span>
              </Label>
              <Select
                options={[{ value: "", label: "Select Company" }, ...companyOptions]}
                value={formData.companyId}
                onChange={(value) => onFieldChange("companyId", value)}
                disabled={disabled}
              />
              <ErrorText message={errors.companyId} />
            </div>
          )}

          {showStatus && (
            <div className="md:col-span-1">
              <Label>Status</Label>
              <Select
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                value={formData.status}
                onChange={(value) => onFieldChange("status", value)}
                disabled={disabled}
              />
              <ErrorText message={errors.status} />
            </div>
          )}

          <div className="md:col-span-2">
            <Label>
              Description <span className="text-red-500">*</span>
            </Label>
            <TextArea
              rows={4}
              value={formData.description}
              onChange={(e) => onFieldChange("description", e.target.value)}
              disabled={disabled}
              error={!!errors.description}
              hint={errors.description}
              placeholder="Enter salary head description"
            />
          </div>

          <div className="md:col-span-1">
            <SimpleDatePicker
              label="Period From *"
              value={formData.periodFrom}
              onChange={(value) =>
                onFieldChange("periodFrom", value ? value.split("T")[0] : "")
              }
              error={!!errors.periodFrom}
              hint={errors.periodFrom}
              disabled={disabled}
            />
          </div>

          <div className="md:col-span-1">
            <SimpleDatePicker
              label="Period To *"
              value={formData.periodTo}
              onChange={(value) =>
                onFieldChange("periodTo", value ? value.split("T")[0] : "")
              }
              error={!!errors.periodTo}
              hint={errors.periodTo}
              disabled={disabled}
            />
          </div>
        </div>
      </ComponentCard>

      <EntrySection
        title="Allowances"
        addLabel="+ Add Allowance"
        emptyLabel="No allowances added."
        tone="allowance"
        entries={formData.allowances}
        errors={errors}
        disabled={disabled}
        fieldKey="allowances"
        namePlaceholder="e.g. Bonus"
        amountPlaceholder="Amount"
        currencySymbol={currencySymbol}
        nameOptions={allowanceOptions}
        loadingNames={loadingAllowances}
        onEntryChange={onAllowanceChange}
        onAddEntry={onAddAllowance}
        onRemoveEntry={onRemoveAllowance}
      />

      <EntrySection
        title="Deductions"
        addLabel="+ Add Deduction"
        emptyLabel="No deductions added."
        tone="deduction"
        entries={formData.deductions}
        errors={errors}
        disabled={disabled}
        fieldKey="deductions"
        namePlaceholder="e.g. Breakage"
        amountPlaceholder="Amount"
        currencySymbol={currencySymbol}
        nameOptions={deductionOptions}
        loadingNames={loadingDeductions}
        onEntryChange={onDeductionChange}
        onAddEntry={onAddDeduction}
        onRemoveEntry={onRemoveDeduction}
      />
    </div>
  );
}
