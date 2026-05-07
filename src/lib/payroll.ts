import {
  MonetaryEntry,
  normalizeMonetaryEntries,
  sumMonetaryEntries,
} from "@/lib/monetaryEntries";

export type PayrollPersistedStatus =
  | "saved"
  | "captain_verified"
  | "finance_approved";
export type PayrollStatus = "draft" | PayrollPersistedStatus;

export interface PayrollLeaveTypeOption {
  id: string;
  code: string;
  name: string;
  maxDays: number;
}

export type PayrollLeaveEntryStatus = "saved" | "pending";

export interface PayrollLeaveEntry {
  leaveTypeId: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  leaveTypeMaxDays: number;
  days: number | null;
  approvedDays: number | null;
  status: PayrollLeaveEntryStatus;
}

export interface PayrollEditableFields {
  leaveEntries: PayrollLeaveEntry[];
  crewAllowances: MonetaryEntry[];
  crewDeductions: MonetaryEntry[];
  bondedStore: number | null;
  cashAdvance: number | null;
  telDeduction: number | null;
  otherDeductions: number | null;
  remarks: string;
}

export interface PayrollRow extends PayrollEditableFields {
  payrollId?: string;
  applicationId: string;
  contractId: string;
  hasActivePayscale: boolean;
  salaryHeadId: string;
  salaryHeadTitle: string;
  crewName: string;
  crewEmail: string;
  rank: string;
  vesselName: string;
  companyId?: string;
  companyName?: string;
  companyLogo?: string;
  profilePhoto?: string | null;
  otherDeductions: number | null;
  remarks: string;
}

export interface PayrollRow extends PayrollEditableFields {
  payrollId?: string;
  applicationId: string;
  contractId: string;
  hasActivePayscale: boolean;
  salaryHeadId: string;
  salaryHeadTitle: string;
  crewName: string;
  crewEmail: string;
  rank: string;
  vesselName: string;
  profilePhoto?: string | null;
  payrollDate: string;
  periodFrom: string;
  periodTo: string;
  payableDays: number;
  payrollMonthDays: number;
  prorationFactor: number;
  basic: number;
  payableBasic: number;
  contractOtherAllowance: number | { value: number; type: 'amount' | 'percent' };
  contractAllowances: MonetaryEntry[];
  salaryHeadAllowances: MonetaryEntry[];
  salaryHeadDeductions: MonetaryEntry[];
  crewDeductions: MonetaryEntry[];
  mergedAllowances: MonetaryEntry[];
  totalAllowance: number;
  grossWages: number;
  leaveDays: number;
  deductibleLeaveDays: number;
  perDayRate: number;
  leaveDeduction: number;
  bondedStore: number | null;
  cashAdvance: number | null;
  telDeduction: number | null;
  otherDeductions: number | null;
  totalDeductions: number;
  netPayable: number;
  status: PayrollStatus;
  verifiedByName: string;
  verifiedAt: string;
  approvedByName: string;
  approvedAt: string;
  crewStatus: string;
  isPersisted: boolean;
}

interface BuildPayrollRowInput {
  payrollId?: string;
  applicationId: string;
  contractId: string;
  hasActivePayscale?: boolean;
  salaryHeadId: string;
  salaryHeadTitle: string;
  crewName: string;
  crewEmail?: string;
  rank: string;
  vesselName?: string;
  companyId?: string;
  companyName?: string;
  companyLogo?: string;
  profilePhoto?: string | null;
  payrollDate: string;
  periodFrom: string;
  periodTo: string;
  basic: number;
  contractOtherAllowance?: number | { value: number; type?: 'amount' | 'percent' };
  contractAllowances?: unknown;
  salaryHeadAllowances?: unknown;
  salaryHeadDeductions?: unknown;
  crewAllowances?: unknown;
  crewDeductions?: unknown;
  leaveTypes?: PayrollLeaveTypeOption[];
  candidateLeaveLimits?: Array<{ leaveTypeId: string; maxDays: number }>;
  editableFields?: Partial<PayrollEditableFields> & {
    leaveEntries?: unknown;
    leaveDays?: unknown;
  };
  status?: PayrollStatus;
  verifiedByName?: string;
  verifiedAt?: string | Date | null;
  approvedByName?: string;
  approvedAt?: string | Date | null;
  crewStatus?: string;
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Number(parsed.toFixed(2));
}

export function toOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Number(parsed.toFixed(2));
}

function normalizeLabel(label: string): string {
  return label.trim().replace(/\s+/g, " ").toLowerCase();
}

function getLegacyDeductionValue(entries: MonetaryEntry[], keys: string[]) {
  const normalizedKeys = keys.map(normalizeLabel);
  const matched = entries.find((entry) =>
    normalizedKeys.some((key) => normalizeLabel(entry.label).includes(key)),
  );

  return matched ? toOptionalNumber(matched.value) : null;
}

function legacyCrewDeductions(input?: {
  bondedStore?: unknown;
  cashAdvance?: unknown;
  telDeduction?: unknown;
  otherDeductions?: unknown;
}) {
  return [
    { label: "Bond Deduction", value: toNumber(input?.bondedStore) },
    { label: "Cash Advance", value: toNumber(input?.cashAdvance) },
    { label: "Telephone Deduction", value: toNumber(input?.telDeduction) },
    { label: "Other Deductions", value: toNumber(input?.otherDeductions) },
  ].filter((entry) => entry.value > 0);
}

function resolveCrewDeductions(input?: {
  crewDeductions?: unknown;
  bondedStore?: unknown;
  cashAdvance?: unknown;
  telDeduction?: unknown;
  otherDeductions?: unknown;
}) {
  const normalized = normalizeMonetaryEntries(input?.crewDeductions);
  return normalized.length ? normalized : legacyCrewDeductions(input);
}

export function normalizePayrollLeaveEntries(entries: unknown): PayrollLeaveEntry[] {
  if (!Array.isArray(entries)) return [];

  return entries
    .map((entry) => {
      const raw = entry as {
        leaveTypeId?: unknown;
        leaveTypeCode?: unknown;
        leaveTypeName?: unknown;
        leaveTypeMaxDays?: unknown;
        days?: unknown;
        approvedDays?: unknown;
        status?: unknown;
      };

      return {
        leaveTypeId: String(raw?.leaveTypeId || "").trim(),
        leaveTypeCode: String(raw?.leaveTypeCode || "").trim().toUpperCase(),
        leaveTypeName: String(raw?.leaveTypeName || "").trim(),
        leaveTypeMaxDays: toNumber(raw?.leaveTypeMaxDays),
        days: toOptionalNumber(raw?.days),
        approvedDays:
          raw?.approvedDays === undefined || raw?.approvedDays === null || raw?.approvedDays === ""
            ? null
            : toOptionalNumber(raw?.approvedDays),
        status:
          raw?.status === "pending"
            ? ("pending" as const)
            : ("saved" as const),
      };
    })
    .filter((entry) => entry.leaveTypeId && entry.leaveTypeCode);
}

export function sumPayrollLeaveEntries(entries?: PayrollLeaveEntry[]): number {
  return Number(
    (entries || [])
      .reduce((sum, entry) => sum + toNumber(entry.days), 0)
      .toFixed(2),
  );
}

function resolvePayrollLeaveFields(input?: {
  leaveEntries?: unknown;
  leaveDays?: unknown;
  leaveTypes?: PayrollLeaveTypeOption[];
  candidateLeaveLimits?: Array<{ leaveTypeId: string; maxDays: number }>;
}) {
  const inputEntries = normalizePayrollLeaveEntries(input?.leaveEntries);
  const leaveTypes = input?.leaveTypes || [];
  const candidateLimits = input?.candidateLeaveLimits || [];

  const leaveEntries = leaveTypes.map((leaveType) => {
    const existingEntry = inputEntries.find(
      (e) => e.leaveTypeId === leaveType.id,
    );
    const candidateLimit = candidateLimits.find(
      (l) => l.leaveTypeId === leaveType.id,
    );

    const resolvedMaxDays = existingEntry
      ? existingEntry.leaveTypeMaxDays > 0
        ? existingEntry.leaveTypeMaxDays
        : candidateLimit?.maxDays ?? leaveType.maxDays
      : candidateLimit?.maxDays ?? leaveType.maxDays;

    const resolvedDays = existingEntry ? toNumber(existingEntry.days) : 0;
    const resolvedApprovedDays =
      existingEntry && existingEntry.approvedDays !== null
        ? Math.min(resolvedDays, toNumber(existingEntry.approvedDays))
        : existingEntry === undefined
          ? resolvedMaxDays
          : resolvedMaxDays;

    return {
      leaveTypeId: leaveType.id,
      leaveTypeCode: leaveType.code,
      leaveTypeName: leaveType.name,
      leaveTypeMaxDays: resolvedMaxDays,
      days: existingEntry ? existingEntry.days : null,
      approvedDays: resolvedApprovedDays,
      status: existingEntry?.status || ("saved" as const),
    };
  });

  return {
    leaveEntries,
    leaveDays: sumPayrollLeaveEntries(leaveEntries) || toNumber(input?.leaveDays),
  };
}

function parseDateParts(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return { year, month, day };
}

export function toPayrollDateString(value?: string | Date | null): string {
  if (!value) return "";

  if (typeof value === "string") {
    return value.includes("T") ? value.split("T")[0] : value;
  }

  return value.toISOString().split("T")[0];
}

export function toPayrollMonthDateString(value?: string | Date | null): string {
  const rawValue = toPayrollDateString(value);
  if (!rawValue) return "";

  const [yearPart, monthPart] = rawValue.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);

  if (!year || !month || month < 1 || month > 12) {
    return "";
  }

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
}

function toPayrollDateTimeString(value?: string | Date | null): string {
  if (!value) return "";

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString();
}

export function toPayrollDate(value: string): Date {
  return new Date(`${toPayrollDateString(value)}T00:00:00.000Z`);
}

export function getPayrollMonthParts(value: string) {
  const normalizedValue = toPayrollMonthDateString(value);
  const parts = parseDateParts(normalizedValue);
  if (!parts) return null;

  return {
    month: parts.month,
    year: parts.year,
  };
}

export function getPayrollMonthRange(value: string) {
  const normalizedValue = toPayrollMonthDateString(value);
  const parts = parseDateParts(normalizedValue);
  if (!parts) return null;

  return {
    start: new Date(Date.UTC(parts.year, parts.month - 1, 1)),
    end: new Date(Date.UTC(parts.year, parts.month, 1)),
    value: normalizedValue,
  };
}

export function getPayrollRowKey(row: Pick<PayrollRow, "payrollId" | "applicationId">) {
  return row.payrollId || row.applicationId;
}

export function mergePayrollAllowances(input: {
  contractOtherAllowance?: number | { value: number; type?: 'amount' | 'percent' };
  contractAllowances?: unknown;
  salaryHeadAllowances?: unknown;
  crewAllowances?: unknown;
}): MonetaryEntry[] {
  const merged = new Map<string, MonetaryEntry>();
  const entries = [
    ...(() => {
      const other = input.contractOtherAllowance;
      const val = toNumber(typeof other === 'object' ? other?.value : other);
      const type = (typeof other === 'object' ? other?.type : 'amount') || 'amount';
      return val > 0 ? [{ label: "Other Allowance", value: val, type }] : [];
    })(),
    ...normalizeMonetaryEntries(input.contractAllowances),
    ...normalizeMonetaryEntries(input.salaryHeadAllowances),
    ...normalizeMonetaryEntries(input.crewAllowances),
  ];

  for (const entry of entries) {
    const keyLabel = normalizeLabel(entry.label || "Allowance");
    if (!keyLabel) continue;

    const type = entry.type || 'amount';
    const key = `${keyLabel}::${type}`;

    const existing = merged.get(key);
    if (existing) {
      existing.value = Number((existing.value + toNumber(entry.value)).toFixed(2));
      continue;
    }

    merged.set(key, {
      label: entry.label.trim(),
      value: toNumber(entry.value),
      type,
    });
  }

  return Array.from(merged.values()).filter(
    (entry) => entry.label && entry.value >= 0,
  );
}

export function getPayrollPeriodDays(periodFrom: string, periodTo: string): number {
  const from = parseDateParts(periodFrom);
  const to = parseDateParts(periodTo);
  if (!from || !to) return 30;

  const fromUtc = Date.UTC(from.year, from.month - 1, from.day);
  const toUtc = Date.UTC(to.year, to.month - 1, to.day);
  const diff = Math.floor((toUtc - fromUtc) / 86_400_000) + 1;

  return diff > 0 ? diff : 30;
}

export function computePayrollTotals(input: {
  payrollDate: string;
  basic: number;
  contractOtherAllowance?: number | { value: number; type?: 'amount' | 'percent' };
  contractAllowances?: unknown;
  salaryHeadAllowances?: unknown;
  salaryHeadDeductions?: unknown;
  crewAllowances?: unknown;
  leaveEntries?: PayrollLeaveEntry[];
  leaveDays?: number;
  bondedStore?: number | null;
  cashAdvance?: number | null;
  telDeduction?: number | null;
  otherDeductions?: number | null;
  crewDeductions?: unknown;
  periodFrom: string;
  periodTo: string;
}) {
  const recurringAllowances = mergePayrollAllowances({
    contractOtherAllowance: input.contractOtherAllowance,
    contractAllowances: input.contractAllowances,
    salaryHeadAllowances: input.salaryHeadAllowances,
  });
  const payrollMonth = getPayrollMonthRange(input.payrollDate);
  const payrollMonthDays = payrollMonth
    ? getPayrollPeriodDays(
      toPayrollDateString(payrollMonth.start),
      toPayrollDateString(new Date(payrollMonth.end.getTime() - 86_400_000)),
    )
    : getPayrollPeriodDays(input.periodFrom, input.periodTo);
  const fullPeriodDays = getPayrollPeriodDays(input.periodFrom, input.periodTo);
  const payrollMonthStart = payrollMonth
    ? toPayrollDateString(payrollMonth.start)
    : input.periodFrom;
  const payableDays =
    input.periodFrom > payrollMonthStart
      ? Math.max(fullPeriodDays - 1, 0)
      : fullPeriodDays;
  const prorationFactor = Number(
    (
      Math.min(Math.max(payableDays, 0), Math.max(payrollMonthDays, 1)) /
      Math.max(payrollMonthDays, 1)
    ).toFixed(6),
  );
  const payableBasic = Number((toNumber(input.basic) * prorationFactor).toFixed(2));
  const recurringAllowanceTotal = Number(
    (
      sumMonetaryEntries(recurringAllowances, input.basic) * prorationFactor
    ).toFixed(2),
  );
  const crewAllowanceTotal = sumMonetaryEntries(
    normalizeMonetaryEntries(input.crewAllowances),
    input.basic,
  );
  const totalAllowance = Number(
    (recurringAllowanceTotal + crewAllowanceTotal).toFixed(2),
  );
  const grossWages = Number((payableBasic + totalAllowance).toFixed(2));
  const perDayRate = Number((grossWages / Math.max(payableDays, 1)).toFixed(2));
  const deductibleLeaveDays = Number(
    (input.leaveEntries || [])
      .reduce(
        (sum, entry) =>
          sum +
          Math.max(
            0,
            toNumber(entry.days) -
            Math.min(
              toNumber(entry.days),
              entry.approvedDays === null
                ? toNumber(entry.leaveTypeMaxDays)
                : toNumber(entry.approvedDays),
            ),
          ),
        0,
      )
      .toFixed(2),
  );
  const leaveDeduction = Number((perDayRate * deductibleLeaveDays).toFixed(2));
  const salaryHeadDeductionTotal = Number(
    (
      sumMonetaryEntries(normalizeMonetaryEntries(input.salaryHeadDeductions), input.basic) *
      prorationFactor
    ).toFixed(2),
  );
  const crewDeductionTotal = sumMonetaryEntries(
    normalizeMonetaryEntries(input.crewDeductions),
    input.basic
  );
  const legacyDeductionTotal =
    crewDeductionTotal > 0
      ? 0
      : toNumber(input.bondedStore) +
      toNumber(input.cashAdvance) +
      toNumber(input.telDeduction) +
      toNumber(input.otherDeductions);
  const totalDeductions = Number(
    (
      salaryHeadDeductionTotal +
      crewDeductionTotal +
      leaveDeduction +
      legacyDeductionTotal
    ).toFixed(2),
  );
  const netPayable = Number((grossWages - totalDeductions).toFixed(2));

  return {
    mergedAllowances: mergePayrollAllowances({
      contractOtherAllowance: input.contractOtherAllowance,
      contractAllowances: input.contractAllowances,
      salaryHeadAllowances: input.salaryHeadAllowances,
      crewAllowances: input.crewAllowances,
    }),
    payableDays,
    payrollMonthDays,
    prorationFactor,
    payableBasic,
    totalAllowance,
    grossWages: Number(grossWages.toFixed(2)),
    deductibleLeaveDays,
    perDayRate,
    leaveDeduction,
    totalDeductions,
    netPayable,
  };
}

function normalizeContractOtherAllowance(
  value?: number | { value: number; type?: "amount" | "percent" },
): number | { value: number; type: "amount" | "percent" } {
  if (typeof value === "object" && value !== null) {
    return {
      value: toNumber(value.value),
      type: value.type || "amount",
    };
  }

  return toNumber(value);
}

export function buildPayrollRow(input: BuildPayrollRowInput): PayrollRow {
  const leaveFields = resolvePayrollLeaveFields({
    leaveEntries: input.editableFields?.leaveEntries,
    leaveDays: input.editableFields?.leaveDays,
    leaveTypes: input.leaveTypes,
    candidateLeaveLimits: input.candidateLeaveLimits,
  });

  const editableFields: PayrollEditableFields = {
    leaveEntries: leaveFields.leaveEntries,
    crewAllowances: normalizeMonetaryEntries(input.editableFields?.crewAllowances),
    crewDeductions: resolveCrewDeductions(input.editableFields),
    bondedStore: null,
    cashAdvance: null,
    telDeduction: null,
    otherDeductions: null,
    remarks: String(input.editableFields?.remarks || "").trim(),
  };
  editableFields.bondedStore = getLegacyDeductionValue(
    editableFields.crewDeductions,
    ["bond"],
  );
  editableFields.cashAdvance = getLegacyDeductionValue(
    editableFields.crewDeductions,
    ["cash", "c/adv", "advance"],
  );
  editableFields.telDeduction = getLegacyDeductionValue(
    editableFields.crewDeductions,
    ["tel", "telephone"],
  );
  editableFields.otherDeductions = getLegacyDeductionValue(
    editableFields.crewDeductions,
    ["other"],
  );

  const totals = computePayrollTotals({
    payrollDate: input.payrollDate,
    basic: input.basic,
    contractOtherAllowance: input.contractOtherAllowance,
    contractAllowances: input.contractAllowances,
    salaryHeadAllowances: input.salaryHeadAllowances,
    salaryHeadDeductions: input.salaryHeadDeductions,
    crewAllowances: editableFields.crewAllowances,
    leaveEntries: leaveFields.leaveEntries,
    leaveDays: leaveFields.leaveDays,
    crewDeductions: editableFields.crewDeductions,
    bondedStore: editableFields.bondedStore,
    cashAdvance: editableFields.cashAdvance,
    telDeduction: editableFields.telDeduction,
    otherDeductions: editableFields.otherDeductions,
    periodFrom: input.periodFrom,
    periodTo: input.periodTo,
  });

  const status = input.status || "draft";

  return {
    payrollId: input.payrollId,
    applicationId: input.applicationId,
    contractId: input.contractId,
    hasActivePayscale: Boolean(input.hasActivePayscale),
    salaryHeadId: input.salaryHeadId,
    salaryHeadTitle: input.salaryHeadTitle,
    crewName: input.crewName.trim(),
    crewEmail: String(input.crewEmail || "").trim(),
    rank: input.rank.trim(),
    vesselName: String(input.vesselName || "").trim() || "—",
    companyId: input.companyId,
    companyName: input.companyName,
    companyLogo: input.companyLogo,
    profilePhoto: input.profilePhoto || null,
    payrollDate: toPayrollDateString(input.payrollDate),
    periodFrom: toPayrollDateString(input.periodFrom),
    periodTo: toPayrollDateString(input.periodTo),
    payableDays: totals.payableDays,
    payrollMonthDays: totals.payrollMonthDays,
    prorationFactor: totals.prorationFactor,
    basic: toNumber(input.basic),
    payableBasic: totals.payableBasic,
    contractOtherAllowance: normalizeContractOtherAllowance(
      input.contractOtherAllowance,
    ),
    contractAllowances: normalizeMonetaryEntries(input.contractAllowances),
    salaryHeadAllowances: normalizeMonetaryEntries(input.salaryHeadAllowances),
    salaryHeadDeductions: normalizeMonetaryEntries(input.salaryHeadDeductions),
    crewAllowances: editableFields.crewAllowances,
    crewDeductions: editableFields.crewDeductions,
    mergedAllowances: totals.mergedAllowances,
    totalAllowance: totals.totalAllowance,
    grossWages: totals.grossWages,
    leaveEntries: editableFields.leaveEntries,
    leaveDays: leaveFields.leaveDays,
    deductibleLeaveDays: totals.deductibleLeaveDays,
    perDayRate: totals.perDayRate,
    leaveDeduction: totals.leaveDeduction,
    bondedStore: editableFields.bondedStore,
    cashAdvance: editableFields.cashAdvance,
    telDeduction: editableFields.telDeduction,
    otherDeductions: editableFields.otherDeductions,
    totalDeductions: totals.totalDeductions,
    netPayable: totals.netPayable,
    remarks: editableFields.remarks,
    status,
    verifiedByName: String(input.verifiedByName || "").trim(),
    verifiedAt: toPayrollDateTimeString(input.verifiedAt),
    approvedByName: String(input.approvedByName || "").trim(),
    approvedAt: toPayrollDateTimeString(input.approvedAt),
    crewStatus: input.crewStatus || "inactive",
    isPersisted: status !== "draft" && Boolean(input.payrollId),
  };
}

export function applyPayrollEditableFields(
  row: PayrollRow,
  editableFields: Partial<PayrollEditableFields>,
): PayrollRow {
  return buildPayrollRow({
    payrollId: row.payrollId,
    applicationId: row.applicationId,
    contractId: row.contractId,
    hasActivePayscale: row.hasActivePayscale,
    salaryHeadId: row.salaryHeadId,
    salaryHeadTitle: row.salaryHeadTitle,
    crewName: row.crewName,
    crewEmail: row.crewEmail,
    rank: row.rank,
    vesselName: row.vesselName,
    companyId: row.companyId,
    companyName: row.companyName,
    companyLogo: row.companyLogo,
    profilePhoto: row.profilePhoto,
    payrollDate: row.payrollDate,
    periodFrom: row.periodFrom,
    periodTo: row.periodTo,
    basic: row.basic,
    contractOtherAllowance: row.contractOtherAllowance,
    contractAllowances: row.contractAllowances,
    salaryHeadAllowances: row.salaryHeadAllowances,
    salaryHeadDeductions: row.salaryHeadDeductions,
    leaveTypes: row.leaveEntries.map((entry) => ({
      id: entry.leaveTypeId,
      code: entry.leaveTypeCode,
      name: entry.leaveTypeName,
      maxDays: entry.leaveTypeMaxDays,
    })),
    editableFields: {
      leaveEntries: editableFields.leaveEntries ?? row.leaveEntries,
      leaveDays: row.leaveDays,
      crewAllowances: editableFields.crewAllowances ?? row.crewAllowances,
      crewDeductions: editableFields.crewDeductions ?? row.crewDeductions,
      bondedStore:
        editableFields.bondedStore === undefined
          ? row.bondedStore
          : editableFields.bondedStore,
      cashAdvance:
        editableFields.cashAdvance === undefined
          ? row.cashAdvance
          : editableFields.cashAdvance,
      telDeduction:
        editableFields.telDeduction === undefined
          ? row.telDeduction
          : editableFields.telDeduction,
      otherDeductions:
        editableFields.otherDeductions === undefined
          ? row.otherDeductions
          : editableFields.otherDeductions,
      remarks: editableFields.remarks ?? row.remarks,
    },
    status: row.status,
    verifiedByName: row.verifiedByName,
    verifiedAt: row.verifiedAt,
    approvedByName: row.approvedByName,
    approvedAt: row.approvedAt,
    crewStatus: row.crewStatus,
  });
}
