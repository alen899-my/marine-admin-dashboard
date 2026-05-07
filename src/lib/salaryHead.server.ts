import { normalizeMonetaryEntries, sumMonetaryEntries } from "@/lib/monetaryEntries";

interface LegacySalaryHeadFields {
  allowances?: unknown;
  deductions?: unknown;
  otherAllowance?: unknown;
  bondedStore?: unknown;
  cashAdvance?: unknown;
  telDeduction?: unknown;
  otherDeductions?: unknown;
  _id?: unknown;
  title?: unknown;
  description?: unknown;
  periodFrom?: unknown;
  periodTo?: unknown;
  status?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  companyId?: unknown;
}

function formatDateForInput(value?: string | Date | null): string {
  if (!value) return "";

  if (typeof value === "string") {
    return value.includes("T") ? value.split("T")[0] : value;
  }

  return value.toISOString().split("T")[0];
}

function toOptionalIsoString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return undefined;
}

function getLegacyAllowanceEntries(input: LegacySalaryHeadFields) {
  const otherAllowance = Number(input.otherAllowance) || 0;
  return otherAllowance > 0
    ? [{ label: "Other Allowance", value: otherAllowance }]
    : [];
}

function getLegacyDeductionEntries(input: LegacySalaryHeadFields) {
  return [
    { label: "Bonded Store", value: Number(input.bondedStore) || 0 },
    { label: "Cash Advance", value: Number(input.cashAdvance) || 0 },
    { label: "Telephone Deduction", value: Number(input.telDeduction) || 0 },
    { label: "Other Deductions", value: Number(input.otherDeductions) || 0 },
  ].filter((entry) => entry.value > 0);
}

export function normalizeSalaryHeadAllowances(input: unknown) {
  if (Array.isArray(input)) {
    return normalizeMonetaryEntries(input);
  }

  const source = (input || {}) as LegacySalaryHeadFields;
  return [
    ...getLegacyAllowanceEntries(source),
    ...normalizeMonetaryEntries(source.allowances),
  ];
}

export function normalizeSalaryHeadDeductions(input: unknown) {
  if (Array.isArray(input)) {
    return normalizeMonetaryEntries(input);
  }

  const source = (input || {}) as LegacySalaryHeadFields;
  return [
    ...getLegacyDeductionEntries(source),
    ...normalizeMonetaryEntries(source.deductions),
  ];
}

export function computeSalaryHeadAllowanceTotal(input: {
  allowances?: { label: string; value: number }[];
  otherAllowance?: number;
}) {
  return sumMonetaryEntries(normalizeSalaryHeadAllowances(input));
}

export function computeSalaryHeadDeductions(input: {
  deductions?: { label: string; value: number }[];
  bondedStore?: number;
  cashAdvance?: number;
  telDeduction?: number;
  otherDeductions?: number;
}) {
  return sumMonetaryEntries(normalizeSalaryHeadDeductions(input));
}

export function hydrateSalaryHeadRecord(record: unknown) {
  const source = (record || {}) as LegacySalaryHeadFields;
  const allowances = normalizeSalaryHeadAllowances(source);
  const deductions = normalizeSalaryHeadDeductions(source);

  return {
    _id: String(source._id || ""),
    title: String(source.title || ""),
    description: String(source.description || ""),
    periodFrom: formatDateForInput(source.periodFrom as string | Date | null | undefined),
    periodTo: formatDateForInput(source.periodTo as string | Date | null | undefined),
    allowances,
    totalAllowance: computeSalaryHeadAllowanceTotal({ allowances }),
    deductions,
    totalDeductions: computeSalaryHeadDeductions({ deductions }),
    companyId: source.companyId && typeof source.companyId === "object"
      ? { _id: String((source.companyId as any)._id || ""), name: String((source.companyId as any).name || "") }
      : String(source.companyId || ""),
    status: source.status === "inactive" ? "inactive" : "active",
    createdAt: toOptionalIsoString(source.createdAt),
    updatedAt: toOptionalIsoString(source.updatedAt),
  };
}
