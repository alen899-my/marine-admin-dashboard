import {
  MonetaryEntry,
  MonetaryEntryFormValue,
  normalizeMonetaryEntries,
  numberToFormValue,
  sumMonetaryEntries,
  toMonetaryEntryFormValues,
} from "@/lib/monetaryEntries";

interface LegacySalaryHeadFields {
  allowances?: unknown;
  deductions?: unknown;
  otherAllowance?: unknown;
  bondedStore?: unknown;
  cashAdvance?: unknown;
  telDeduction?: unknown;
  otherDeductions?: unknown;
}

export interface SalaryHeadAllowance extends MonetaryEntry {}
export interface SalaryHeadDeduction extends MonetaryEntry {}
export interface SalaryHeadFormAllowance extends MonetaryEntryFormValue {}
export interface SalaryHeadFormDeduction extends MonetaryEntryFormValue {}

export interface SalaryHeadFormValues {
  companyId: string;
  title: string;
  description: string;
  periodFrom: string;
  periodTo: string;
  allowances: SalaryHeadFormAllowance[];
  deductions: SalaryHeadFormDeduction[];
  status: "active" | "inactive";
}

export interface SalaryHeadRecord {
  _id: string;
  companyId: { _id: string; name: string } | string;
  title: string;
  description: string;
  periodFrom: string;
  periodTo: string;
  allowances: SalaryHeadAllowance[];
  totalAllowance: number;
  deductions: SalaryHeadDeduction[];
  totalDeductions: number;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export function createEmptySalaryHeadForm(companyId?: string): SalaryHeadFormValues {
  return {
    companyId: companyId || "",
    title: "",
    description: "",
    periodFrom: "",
    periodTo: "",
    allowances: [],
    deductions: [],
    status: "active",
  };
}

function getLegacyAllowanceEntries(input: LegacySalaryHeadFields): MonetaryEntry[] {
  const otherVal = input.otherAllowance;
  if (otherVal && typeof otherVal === "object") {
    const obj = otherVal as { value?: number | string; type?: 'amount' | 'percent' };
    return [{ 
      label: "Other Allowance", 
      value: Number(obj.value) || 0, 
      type: obj.type || 'amount' 
    }];
  }
  const otherAllowance = Number(otherVal) || 0;
  return otherAllowance > 0
    ? [{ label: "Other Allowance", value: otherAllowance }]
    : [];
}

function getLegacyDeductionEntries(input: LegacySalaryHeadFields): MonetaryEntry[] {
  const legacyEntries = [
    { label: "Bonded Store", value: Number(input.bondedStore) || 0 },
    { label: "Cash Advance", value: Number(input.cashAdvance) || 0 },
    { label: "Telephone Deduction", value: Number(input.telDeduction) || 0 },
    { label: "Other Deductions", value: Number(input.otherDeductions) || 0 },
  ];

  return legacyEntries.filter((entry) => entry.value > 0);
}

export function normalizeSalaryHeadAllowances(
  input: LegacySalaryHeadFields | unknown,
): SalaryHeadAllowance[] {
  if (Array.isArray(input)) {
    return normalizeMonetaryEntries(input);
  }

  const source = (input || {}) as LegacySalaryHeadFields;
  return [
    ...getLegacyAllowanceEntries(source),
    ...normalizeMonetaryEntries(source.allowances),
  ];
}

export function normalizeSalaryHeadDeductions(
  input: LegacySalaryHeadFields | unknown,
): SalaryHeadDeduction[] {
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
  allowances?: SalaryHeadAllowance[];
  otherAllowance?: number;
}): number {
  return sumMonetaryEntries(normalizeSalaryHeadAllowances(input));
}

export function computeSalaryHeadDeductions(input: {
  deductions?: SalaryHeadDeduction[];
  bondedStore?: number;
  cashAdvance?: number;
  telDeduction?: number;
  otherDeductions?: number;
}): number {
  return sumMonetaryEntries(normalizeSalaryHeadDeductions(input));
}

export function toSalaryHeadPayload(formData: SalaryHeadFormValues) {
  const allowances = normalizeSalaryHeadAllowances(formData.allowances);
  const deductions = normalizeSalaryHeadDeductions(formData.deductions);

  return {
    companyId: formData.companyId,
    title: formData.title.trim(),
    description: formData.description.trim(),
    periodFrom: formData.periodFrom,
    periodTo: formData.periodTo,
    allowances,
    deductions,
    status: formData.status,
  };
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

export function hydrateSalaryHeadRecord(record: any): SalaryHeadRecord {
  const allowances = normalizeSalaryHeadAllowances(record);
  const deductions = normalizeSalaryHeadDeductions(record);

  return {
    _id: String(record._id || ""),
    companyId: record.companyId && typeof record.companyId === 'object' 
      ? { _id: String((record.companyId as any)._id || ""), name: String((record.companyId as any).name || "") }
      : String(record.companyId || ""),
    title: record.title || "",
    description: record.description || "",
    periodFrom: formatDateForInput(record.periodFrom),
    periodTo: formatDateForInput(record.periodTo),
    allowances,
    totalAllowance: computeSalaryHeadAllowanceTotal({ allowances }),
    deductions,
    totalDeductions: computeSalaryHeadDeductions({ deductions }),
    status: record.status || "active",
    createdAt: toOptionalIsoString(record.createdAt),
    updatedAt: toOptionalIsoString(record.updatedAt),
  };
}

export function toSalaryHeadFormValues(
  record: SalaryHeadRecord | (Partial<SalaryHeadRecord> & LegacySalaryHeadFields & { _id?: unknown }),
): SalaryHeadFormValues {
  const hydratedRecord = hydrateSalaryHeadRecord(record);

  return {
    companyId: typeof hydratedRecord.companyId === 'string' 
      ? hydratedRecord.companyId 
      : (hydratedRecord.companyId as any)?._id || "",
    title: hydratedRecord.title,
    description: hydratedRecord.description,
    periodFrom: formatDateForInput(hydratedRecord.periodFrom),
    periodTo: formatDateForInput(hydratedRecord.periodTo),
    allowances: toMonetaryEntryFormValues(hydratedRecord.allowances),
    deductions: toMonetaryEntryFormValues(hydratedRecord.deductions),
    status: hydratedRecord.status,
  };
}
