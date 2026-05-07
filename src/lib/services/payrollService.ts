import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import {
  buildPayrollRow,
  getPayrollMonthParts,
  getPayrollMonthRange,
  PayrollEditableFields,
  PayrollLeaveTypeOption,
  PayrollPersistedStatus,
  PayrollRow,
  toPayrollDate,
  toPayrollDateString,
  toPayrollMonthDateString,
} from "@/lib/payroll";
import { hydrateSalaryHeadRecord } from "@/lib/salaryHead.server";
import Candidate from "@/models/Candidate";
import Company from "@/models/Company";
import Contract from "@/models/Contract";
import LeaveType from "@/models/LeaveType";
import Payroll from "@/models/Payroll";
import SalaryHead from "@/models/SalaryHead";
import User from "@/models/User";
import { resolveWageTimeline } from "@/lib/wageHistory";
import {
  canVerifyPayrollForRole,
  isCaptainRole,
} from "@/lib/payrollVerificationAccess";
import { getSettings } from "@/lib/systemSettings.server";

interface SessionUserLike {
  id?: string;
  role?: string;
  company?: {
    id?: string | null;
    name?: string | null;
  } | null;
}

interface PayrollDashboardParams {
  user: SessionUserLike;
  salaryHeadId?: string;
  payrollDate?: string;
  search?: string;
  status?: string;
  companyId?: string;
  rank?: string;
  vessel?: string;
  payscaleStatus?: string;
  salaryHeadState?: string;
}

interface PayrollSaveItem extends Partial<PayrollEditableFields> {
  applicationId: string;
  salaryHeadId?: string | null;
  leaveDays?: number;
}

interface SavePayrollRecordsParams {
  user: SessionUserLike;
  salaryHeadId: string;
  payrollDate: string;
  companyId?: string;
  items: PayrollSaveItem[];
}

interface TransitionPayrollRecordsParams {
  user: SessionUserLike;
  ids: string[];
  action: "verify" | "approve";
}

interface UpdatePayrollRecordParams {
  user: SessionUserLike;
  id: string;
  input: Partial<PayrollEditableFields> & {
    salaryHeadId?: string | null;
    leaveDays?: number;
  };
}

interface DeletePayrollRecordParams {
  user: SessionUserLike;
  id: string;
}

interface SalaryHeadOption {
  id: string;
  title: string;
  periodFrom: string;
  periodTo: string;
}

interface CompanyOption {
  id: string;
  name: string;
}

interface PayrollDashboardData {
  salaryHeads: SalaryHeadOption[];
  companies: CompanyOption[];
  leaveTypes: PayrollLeaveTypeOption[];
  selectedSalaryHeadId: string;
  selectedSalaryHeadTitle: string;
  selectedPeriodFrom: string;
  selectedPeriodTo: string;
  selectedSalaryHeadAllowances: Array<{
    label: string;
    value: number;
    type?: "amount" | "percent";
  }>;
  selectedSalaryHeadDeductions: Array<{
    label: string;
    value: number;
    type?: "amount" | "percent";
  }>;
  payrollDate: string;
  search: string;
  status: string;
  companyId: string;
  rank: string;
  vessel: string;
  payscaleStatus: string;
  salaryHeadState: string;
  isSuperAdmin: boolean;
  rows: PayrollRow[];
}

const PAYROLL_SNAPSHOT_FIELDS_TO_UNSET = {
  salaryHeadTitle: "",
  crewName: "",
  crewEmail: "",
  rank: "",
  vesselName: "",
  contractAllowances: "",
} as const;

function getPayrollPeriodFromMonth(payrollDate: string) {
  const payrollMonth = getPayrollMonthRange(payrollDate);
  if (!payrollMonth) {
    throw new Error("Invalid payroll month");
  }

  const periodToDate = new Date(payrollMonth.end);
  periodToDate.setUTCDate(periodToDate.getUTCDate() - 1);

  return {
    periodFrom: toPayrollDateString(payrollMonth.start),
    periodTo: toPayrollDateString(periodToDate),
    payrollMonth,
  };
}

function getOverlappingDateRange(input: {
  leftFrom: string;
  leftTo: string;
  rightFrom?: string | null;
  rightTo?: string | null;
}) {
  if (!input.rightFrom) {
    return {
      periodFrom: input.leftFrom,
      periodTo: input.leftTo,
    };
  }

  const periodFrom =
    input.rightFrom > input.leftFrom ? input.rightFrom : input.leftFrom;
  const periodTo =
    input.rightTo && input.rightTo < input.leftTo ? input.rightTo : input.leftTo;

  if (periodFrom > periodTo) {
    return null;
  }

  return { periodFrom, periodTo };
}

function pickWageForPayrollPeriod(wages: any[], payrollDate: string) {
  if (!wages.length) {
    return null;
  }

  const payrollPeriod = getPayrollPeriodFromMonth(payrollDate);
  const overlapping = resolveWageTimeline(wages)
    .map((entry) => {
      const overlap = getOverlappingDateRange({
        leftFrom: payrollPeriod.periodFrom,
        leftTo: payrollPeriod.periodTo,
        rightFrom: toPayrollDateString(entry.effectiveFrom),
        rightTo: entry.effectiveTo ? toPayrollDateString(entry.effectiveTo) : null,
      });

      if (!overlap) {
        return null;
      }

      return {
        wage: entry.wage,
        periodFrom: overlap.periodFrom,
        periodTo: overlap.periodTo,
      };
    })
    .filter(Boolean) as Array<{
      wage: any;
      periodFrom: string;
      periodTo: string;
    }>;

  return overlapping.length ? overlapping[overlapping.length - 1] : null;
}

function isSuperAdmin(user: SessionUserLike) {
  return user.role?.toLowerCase() === "super-admin";
}

function getCompanyQuery(user: SessionUserLike) {
  const companyId = user.company?.id;
  if (!companyId || !mongoose.isValidObjectId(companyId)) {
    return null;
  }

  return new mongoose.Types.ObjectId(companyId);
}

function getResolvedCompanyScope(
  user: SessionUserLike,
  companyId?: string,
): mongoose.Types.ObjectId | null {
  if (companyId && mongoose.isValidObjectId(companyId)) {
    return new mongoose.Types.ObjectId(companyId);
  }

  return getCompanyQuery(user);
}

function getHydratedSalaryHeadCompanyId(
  salaryHead: Awaited<ReturnType<typeof getSalaryHeadSnapshot>> | null,
) {
  if (!salaryHead) return "";

  const companyId = salaryHead.companyId;
  if (companyId && typeof companyId === "object") {
    return String((companyId as { _id?: string })._id || "");
  }

  return String(companyId || "");
}

function ensureObjectId(id: string, fieldName: string) {
  if (!mongoose.isValidObjectId(id)) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return new mongoose.Types.ObjectId(id);
}

function normalizeEditableFields(
  input?: Partial<PayrollEditableFields> & { leaveDays?: number },
) {
  return {
    leaveEntries: Array.isArray(input?.leaveEntries) ? input.leaveEntries : [],
    leaveDays: Number(input?.leaveDays) || 0,
    crewAllowances: Array.isArray(input?.crewAllowances)
      ? input.crewAllowances
      : [],
    crewDeductions: Array.isArray(input?.crewDeductions)
      ? input.crewDeductions
      : [],
    bondedStore: Number(input?.bondedStore) || 0,
    cashAdvance: Number(input?.cashAdvance) || 0,
    telDeduction: Number(input?.telDeduction) || 0,
    otherDeductions: Number(input?.otherDeductions) || 0,
    remarks: String(input?.remarks || "").trim(),
  };
}

async function getSalaryHeadOptions(companyId?: string | mongoose.Types.ObjectId) {
  const query: Record<string, unknown> = {
    deletedAt: null,
    status: "active",
  };

  if (companyId) {
    query.$or = [
      { companyId: companyId },
      { companyId: { $exists: false } },
      { companyId: null },
    ];
  }

  const records = await SalaryHead.find(query)
    .sort({ title: 1 })
    .select("title periodFrom periodTo")
    .lean();

  return records.map((record: any) => ({
    id: String(record._id),
    title: String(record.title || ""),
    periodFrom: toPayrollDateString(record.periodFrom),
    periodTo: toPayrollDateString(record.periodTo),
  }));
}

async function getCompanyOptions(): Promise<CompanyOption[]> {
  const records = await Company.find({
    deletedAt: null,
  })
    .sort({ name: 1 })
    .select("name")
    .lean();

  return records.map((record: any) => ({
    id: String(record._id),
    name: String(record.name || "").trim(),
  }));
}

async function getLeaveTypeOptions(
  companyId?: string | mongoose.Types.ObjectId | null,
): Promise<PayrollLeaveTypeOption[]> {
  const query: Record<string, unknown> = {
    status: "active",
  };

  if (companyId) {
    const resolvedCompanyId =
      companyId instanceof mongoose.Types.ObjectId
        ? companyId
        : mongoose.isValidObjectId(companyId)
          ? new mongoose.Types.ObjectId(companyId)
          : null;

    if (resolvedCompanyId) {
      query.companyId = resolvedCompanyId;
    }
  }

  const records = await LeaveType.find(query)
    .sort({ code: 1, name: 1 })
    .select("code name maxDays")
    .lean();

  return records.map((record: any) => ({
    id: String(record._id),
    code: String(record.code || "").trim().toUpperCase(),
    name: String(record.name || "").trim(),
    maxDays: Number(record.maxDays) || 0,
  }));
}

async function getSalaryHeadSnapshot(salaryHeadId: string) {
  if (!salaryHeadId || !mongoose.isValidObjectId(salaryHeadId)) {
    return null;
  }

  const salaryHead = await SalaryHead.findOne({
    _id: new mongoose.Types.ObjectId(salaryHeadId),
    deletedAt: null,
  }).lean();

  if (!salaryHead) {
    return null;
  }

  return hydrateSalaryHeadRecord(salaryHead);
}

async function getSalaryHeadSnapshotMap(salaryHeadIds: string[]) {
  const validIds = Array.from(
    new Set(salaryHeadIds.filter((id) => mongoose.isValidObjectId(id))),
  );

  if (!validIds.length) {
    return new Map<string, Awaited<ReturnType<typeof getSalaryHeadSnapshot>>>();
  }

  const records = await SalaryHead.find({
    _id: {
      $in: validIds.map((id) => new mongoose.Types.ObjectId(id)),
    },
    deletedAt: null,
  }).lean();

  return new Map(
    (records as any[]).map((record) => {
      const hydrated = hydrateSalaryHeadRecord(record);
      return [String(hydrated._id), hydrated];
    }),
  );
}

async function getPayrollSourceRows({
  user,
  salaryHeadId,
  payrollDate,
  leaveTypes,
  applicationIds,
  search,
  status,
  companyId,
  rank,
  vessel,
  payscaleStatus,
  salaryHeadState,
}: {
  user: SessionUserLike;
  salaryHeadId: string;
  payrollDate: string;
  leaveTypes: PayrollLeaveTypeOption[];
  applicationIds?: string[];
  search?: string;
  status?: string;
  companyId?: string;
  rank?: string;
  vessel?: string;
  payscaleStatus?: string;
  salaryHeadState?: string;
}) {
  const payrollPeriod = getPayrollPeriodFromMonth(payrollDate);
  const { payrollMonth, periodFrom, periodTo } = payrollPeriod;
  const salaryHead = salaryHeadId ? await getSalaryHeadSnapshot(salaryHeadId) : null;

  const requestedCompanyObjectId =
    companyId && mongoose.isValidObjectId(companyId)
      ? new mongoose.Types.ObjectId(companyId)
      : null;
  const companyObjectId = requestedCompanyObjectId || getCompanyQuery(user);

  // ── Get active crew applicationIds from the Crew collection
  const CrewModel = (await import("@/models/Crew")).default;
  const activeCrewQuery: Record<string, unknown> = {
    crewStatus: { $in: ["onboard", "vacation", "available", "traveling", "medical_leave", "training"] },
    deletedAt: null,
  };
  if (companyObjectId) {
    activeCrewQuery.company = companyObjectId;
  }
  const activeCrewDocs = await CrewModel.find(activeCrewQuery)
    .select("applicationId")
    .lean();
  const activeApplicationIds = activeCrewDocs.map((c: any) => c.applicationId);

  const candidateQuery: Record<string, unknown> = {
    deletedAt: null,
  };

  if (companyObjectId) {
    candidateQuery.company = companyObjectId;
  }

  if (applicationIds?.length) {
    candidateQuery._id = {
      $in: applicationIds
        .filter((id) => mongoose.isValidObjectId(id))
        .map((id) => new mongoose.Types.ObjectId(id)),
    };
  } else {
    candidateQuery.status = "onboarded";
    // Filter by active crew application IDs from Crew collection
    if (activeApplicationIds.length > 0) {
      candidateQuery._id = { $in: activeApplicationIds };
    } else {
      // No active crew — return early
      return { salaryHead, rows: [] as PayrollRow[] };
    }
  }

  if (search?.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    candidateQuery.$or = [
      { firstName: { $regex: escapedSearch, $options: "i" } },
      { lastName: { $regex: escapedSearch, $options: "i" } },
      { email: { $regex: escapedSearch, $options: "i" } },
      { rank: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const candidates = await Candidate.find(candidateQuery)
    .select("company firstName lastName email rank leaveLimits crew profilePhoto")
    .sort({ firstName: 1, lastName: 1 })
    .lean();

  if (!candidates.length) {
    return {
      salaryHead,
      rows: [] as PayrollRow[],
    };
  }

  // ── Fetch Crew documents for leaveLimits and crewStatus
  const candidateObjectIds2 = candidates.map((c: any) => c._id);
  const crewDocs = await CrewModel.find({
    applicationId: { $in: candidateObjectIds2 },
    deletedAt: null,
  })
    .select("applicationId crewStatus leaveLimits")
    .lean();
  const crewDocMap = new Map<string, any>();
  for (const doc of crewDocs as any[]) {
    crewDocMap.set(String(doc.applicationId), doc);
  }

  // Fetch company data for all candidates
  const companyIds = Array.from(
    new Set(
      candidates
        .map((c: any) => String(c.company))
        .filter((id: string) => mongoose.isValidObjectId(id)),
    ),
  );
  const companies = companyIds.length
    ? await Company.find({
      _id: { $in: companyIds.map((id: string) => new mongoose.Types.ObjectId(id)) },
      deletedAt: null,
    })
      .select("name logo")
      .lean()
    : [];
  const companyMap = new Map<string, { name?: string; logo?: string }>(
    (companies as any[]).map((comp: any) => [String(comp._id), { name: comp.name, logo: comp.logo }]),
  );

  const applicationObjectIds = candidates.map((candidate: any) => candidate._id);

  const contracts = await Contract.find({
    applicationId: { $in: applicationObjectIds },
    deletedAt: null,
  })
    .populate("vesselId", "name")
    .sort({ createdAt: -1 })
    .lean();

  const latestContractMap = new Map<string, any>();
  const contractById = new Map<string, any>();
  for (const contract of contracts as any[]) {
    contractById.set(String(contract._id), contract);
    const key = String(contract.applicationId);
    if (!latestContractMap.has(key)) {
      latestContractMap.set(key, contract);
    }
  }

  const contractIds = Array.from(contractById.values()).map(
    (contract: any) => contract._id,
  );

  const Wage = (await import("@/models/Wage")).default;
  const wages = contractIds.length
    ? await Wage.find({
      contractId: { $in: contractIds },
      deletedAt: null,
    })
      .sort({ effectiveFrom: -1, createdAt: -1 })
      .lean()
    : [];

  const wageSelectionMap = new Map<
    string,
    { wage: any; periodFrom: string; periodTo: string }
  >();
  const wagesByContract = new Map<string, any[]>();
  for (const wage of wages as any[]) {
    const contractId = String(wage.contractId);
    const existing = wagesByContract.get(contractId) || [];
    existing.push(wage);
    wagesByContract.set(contractId, existing);
  }

  for (const [contractId, contractWages] of wagesByContract.entries()) {
    const wageSelection = pickWageForPayrollPeriod(contractWages, payrollDate);
    if (wageSelection) {
      wageSelectionMap.set(contractId, wageSelection);
    }
  }

  const payrolls = await Payroll.find({
    payrollDate: {
      $gte: payrollMonth.start,
      $lt: payrollMonth.end,
    },
    deletedAt: null,
    applicationId: { $in: applicationObjectIds },
    ...(companyObjectId ? { company: companyObjectId } : {}),
  })
    .sort({ payrollDate: -1, updatedAt: -1 })
    .lean();

  const payrollMap = new Map<string, any>();
  for (const payroll of payrolls as any[]) {
    const applicationId = String(payroll.applicationId);
    if (!payrollMap.has(applicationId)) {
      payrollMap.set(applicationId, payroll);
    }
  }

  const auditUserIds = Array.from(
    new Set(
      payrolls
        .flatMap((payroll: any) => [
          payroll?.verifiedBy ? String(payroll.verifiedBy) : "",
          payroll?.approvedBy ? String(payroll.approvedBy) : "",
        ])
        .filter((id) => mongoose.isValidObjectId(id)),
    ),
  );

  const auditUsers = auditUserIds.length
    ? await User.find({
      _id: {
        $in: auditUserIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
    })
      .select("_id fullName")
      .lean()
    : [];
  const auditUserMap = new Map(
    (auditUsers as Array<{ _id: mongoose.Types.ObjectId; fullName?: string }>).map(
      (user) => [String(user._id), String(user.fullName || "").trim()],
    ),
  );

  const referencedSalaryHeadIds = Array.from(
    new Set(
      payrolls
        .map((payroll: any) =>
          payroll?.salaryHeadId ? String(payroll.salaryHeadId) : "",
        )
        .filter(Boolean)
        .filter((id) => mongoose.isValidObjectId(id)),
    ),
  ).filter((id) => id !== salaryHeadId);

  const additionalSalaryHeads = referencedSalaryHeadIds.length
    ? await SalaryHead.find({
      _id: {
        $in: referencedSalaryHeadIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
      deletedAt: null,
    }).lean()
    : [];

  const salaryHeadMap = new Map<string, any>();
  if (salaryHead?._id) {
    salaryHeadMap.set(String(salaryHead._id), salaryHead);
  }

  for (const record of additionalSalaryHeads as any[]) {
    salaryHeadMap.set(String(record._id), hydrateSalaryHeadRecord(record));
  }

  const rows = candidates
    .map((candidate: any) => {
      const applicationId = String(candidate._id);
      const existingPayroll = payrollMap.get(applicationId);
      const latestContract = latestContractMap.get(applicationId);
      const payrollContractId = existingPayroll?.contractId
        ? String(existingPayroll.contractId)
        : "";
      const contract =
        (payrollContractId ? contractById.get(payrollContractId) : null) ||
        latestContract ||
        null;

      if (!contract && !existingPayroll) return null;

      const resolvedContractId = contract
        ? String(contract._id)
        : payrollContractId;
      const wageSelection = resolvedContractId
        ? wageSelectionMap.get(resolvedContractId)
        : null;
      const wage = wageSelection?.wage || null;
      const resolvedSalaryHeadId = existingPayroll?.salaryHeadId
        ? String(existingPayroll.salaryHeadId)
        : "";
      const resolvedSalaryHead = resolvedSalaryHeadId
        ? salaryHeadMap.get(resolvedSalaryHeadId) || null
        : null;
      const crewName =
        `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() ||
        contract?.seafarerName ||
        existingPayroll?.crewName ||
        "";

      return buildPayrollRow({
        payrollId: existingPayroll ? String(existingPayroll._id) : undefined,
        applicationId,
        contractId: resolvedContractId,
        hasActivePayscale: Boolean(wage) || Boolean(existingPayroll),
        leaveTypes,
        candidateLeaveLimits: (crewDocMap.get(applicationId)?.leaveLimits ?? [])?.map((l: any) => ({
          leaveTypeId: String(l.leaveTypeId),
          maxDays: Number(l.maxDays),
        })),
        salaryHeadId: resolvedSalaryHeadId,
        salaryHeadTitle: resolvedSalaryHead?.title || "",
        crewName,
        crewEmail:
          candidate.email ||
          contract?.seafarerEmail ||
          existingPayroll?.crewEmail ||
          "",
        rank: candidate.rank || contract?.rank || existingPayroll?.rank || "",
        vesselName:
          (contract?.vesselId as { name?: string } | null)?.name ||
          contract?.vesselName ||
          existingPayroll?.vesselName ||
          "—",
        crewStatus: crewDocMap.get(applicationId)?.crewStatus ?? candidate.crew ?? "inactive",
        companyId: candidate.company ? String(candidate.company) : undefined,
        companyName: candidate.company ? companyMap.get(String(candidate.company))?.name : undefined,
        companyLogo: candidate.company ? companyMap.get(String(candidate.company))?.logo : undefined,
        profilePhoto: candidate.profilePhoto || null,
        payrollDate: existingPayroll
          ? toPayrollDateString(existingPayroll.payrollDate)
          : payrollMonth.value,
        periodFrom:
          wageSelection?.periodFrom ||
          (existingPayroll
            ? toPayrollDateString(existingPayroll.periodFrom)
            : periodFrom),
        periodTo:
          wageSelection?.periodTo ||
          (existingPayroll
            ? toPayrollDateString(existingPayroll.periodTo)
            : periodTo),
        basic: wage ? Number(wage.basic) || 0 : Number(existingPayroll?.basic) || 0,
        contractOtherAllowance: wage
          ? wage.otherAllowance
          : existingPayroll?.contractOtherAllowance || 0,
        contractAllowances: wage?.allowances || existingPayroll?.contractAllowances || [],
        salaryHeadAllowances:
          resolvedSalaryHead?.allowances ||
          existingPayroll?.salaryHeadAllowances ||
          [],
        salaryHeadDeductions:
          resolvedSalaryHead?.deductions ||
          existingPayroll?.salaryHeadDeductions ||
          [],
        editableFields: existingPayroll
          ? {
            leaveEntries: existingPayroll.leaveEntries,
            leaveDays: existingPayroll.leaveDays,
            crewAllowances: existingPayroll.crewAllowances,
            crewDeductions: existingPayroll.crewDeductions,
            bondedStore: existingPayroll.bondedStore,
            cashAdvance: existingPayroll.cashAdvance,
            telDeduction: existingPayroll.telDeduction,
            otherDeductions: existingPayroll.otherDeductions,
            remarks: existingPayroll.remarks || "",
          }
          : {},
        status: existingPayroll
          ? (existingPayroll.status as PayrollPersistedStatus)
          : "draft",
        verifiedByName: existingPayroll?.verifiedBy
          ? auditUserMap.get(String(existingPayroll.verifiedBy)) || ""
          : "",
        verifiedAt: existingPayroll?.verifiedAt || null,
        approvedByName: existingPayroll?.approvedBy
          ? auditUserMap.get(String(existingPayroll.approvedBy)) || ""
          : "",
        approvedAt: existingPayroll?.approvedAt || null,
      });
    })
    .filter(Boolean)
    .filter((row) => {
      if (!status || status === "all") return true;
      return row?.status === status;
    })
    .filter((row) => {
      if (!rank) return true;
      return row?.rank === rank;
    })
    .filter((row) => {
      if (!vessel) return true;
      return row?.vesselName === vessel;
    })
    .filter((row) => {
      if (!payscaleStatus || payscaleStatus === "all") return true;
      if (payscaleStatus === "with_payscale") {
        return Boolean(row?.hasActivePayscale);
      }
      if (payscaleStatus === "missing_payscale") {
        return !row?.hasActivePayscale;
      }
      return true;
    })
    .filter((row) => {
      if (!salaryHeadState || salaryHeadState === "all") return true;
      if (salaryHeadState === "assigned") {
        return Boolean(row?.salaryHeadId);
      }
      if (salaryHeadState === "unassigned") {
        return !row?.salaryHeadId;
      }
      return true;
    }) as PayrollRow[];

  return {
    salaryHead,
    rows,
  };
}

function toPayrollDocument(row: PayrollRow, companyId: mongoose.Types.ObjectId, userId?: string) {
  const userObjectId =
    userId && mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;
  const payrollMonthParts = getPayrollMonthParts(row.payrollDate);

  if (!payrollMonthParts) {
    throw new Error("Invalid payroll month");
  }

  return {
    company: companyId,
    applicationId: ensureObjectId(row.applicationId, "application"),
    contractId: ensureObjectId(row.contractId, "contract"),
    salaryHeadId: row.salaryHeadId
      ? ensureObjectId(row.salaryHeadId, "salary head")
      : null,
    payrollDate: toPayrollDate(row.payrollDate),
    month: payrollMonthParts.month,
    year: payrollMonthParts.year,
    periodFrom: toPayrollDate(row.periodFrom),
    periodTo: toPayrollDate(row.periodTo),
    basic: row.basic,
    contractOtherAllowance: row.contractOtherAllowance,
    salaryHeadAllowances: row.salaryHeadAllowances,
    salaryHeadDeductions: row.salaryHeadDeductions,
    crewAllowances: row.crewAllowances,
    crewDeductions: row.crewDeductions,
    mergedAllowances: row.mergedAllowances,
    totalAllowance: row.totalAllowance,
    grossWages: row.grossWages,
    leaveEntries: row.leaveEntries.map((entry) => ({
      leaveTypeId: ensureObjectId(entry.leaveTypeId, "leave type"),
      leaveTypeCode: entry.leaveTypeCode,
      leaveTypeName: entry.leaveTypeName,
      leaveTypeMaxDays: entry.leaveTypeMaxDays,
      days: typeof entry.days === "number" ? entry.days : 0,
      approvedDays: entry.approvedDays,
      status: entry.status,
    })),
    leaveDays: row.leaveDays,
    leaveDeduction: row.leaveDeduction,
    bondedStore: row.bondedStore,
    cashAdvance: row.cashAdvance,
    telDeduction: row.telDeduction,
    otherDeductions: row.otherDeductions,
    totalDeductions: row.totalDeductions,
    netPayable: row.netPayable,
    remarks: row.remarks,
    status: row.status || "draft",
    savedBy: row.status !== "draft" ? userObjectId : null,
    verifiedBy: null,
    verifiedAt: null,
    approvedBy: null,
    approvedAt: null,
    deletedAt: null,
  };
}

function buildScopeQuery(user: SessionUserLike, id?: string) {
  const query: Record<string, unknown> = {
    deletedAt: null,
  };

  if (id) {
    query._id = ensureObjectId(id, "payroll");
  }

  if (isSuperAdmin(user)) {
    return query;
  }

  const companyObjectId = getCompanyQuery(user);
  if (companyObjectId) {
    query.company = companyObjectId;
  } else {
    throw new Error("Unable to determine company");
  }

  return query;
}

export async function getPayrollDashboardData({
  user,
  salaryHeadId,
  payrollDate,
  search,
  status,
  companyId,
  rank,
  vessel,
  payscaleStatus,
  salaryHeadState,
}: PayrollDashboardParams): Promise<PayrollDashboardData> {
  await dbConnect();

  const companyObjectId = getResolvedCompanyScope(user, companyId);
  const requiresCompanySelection = isSuperAdmin(user) && !companyObjectId;

  if (requiresCompanySelection) {
    return {
      salaryHeads: [],
      companies: await getCompanyOptions(),
      leaveTypes: [],
      selectedSalaryHeadId: "",
      selectedSalaryHeadTitle: "",
      selectedPeriodFrom: getPayrollPeriodFromMonth(
        toPayrollMonthDateString(payrollDate) || toPayrollMonthDateString(new Date()),
      ).periodFrom,
      selectedPeriodTo: getPayrollPeriodFromMonth(
        toPayrollMonthDateString(payrollDate) || toPayrollMonthDateString(new Date()),
      ).periodTo,
      selectedSalaryHeadAllowances: [],
      selectedSalaryHeadDeductions: [],
      payrollDate:
        toPayrollMonthDateString(payrollDate) || toPayrollMonthDateString(new Date()),
      search: String(search || "").trim(),
      status: String(status || "all").trim() || "all",
      companyId: "",
      rank: String(rank || "").trim(),
      vessel: String(vessel || "").trim(),
      payscaleStatus: String(payscaleStatus || "all").trim() || "all",
      salaryHeadState: String(salaryHeadState || "all").trim() || "all",
      isSuperAdmin: true,
      rows: [],
    };
  }

  const [salaryHeads, leaveTypes, companies] = await Promise.all([
    getSalaryHeadOptions(companyObjectId || undefined),
    getLeaveTypeOptions(companyObjectId || undefined),
    isSuperAdmin(user) ? getCompanyOptions() : Promise.resolve([]),
  ]);
  const selectedSalaryHeadId = String(salaryHeadId || "");
  const resolvedPayrollDate =
    toPayrollMonthDateString(payrollDate) || toPayrollMonthDateString(new Date());
  const resolvedSearch = String(search || "").trim();
  const resolvedStatus = String(status || "all").trim() || "all";
  const resolvedCompanyId = String(companyId || "").trim();
  const resolvedRank = String(rank || "").trim();
  const resolvedVessel = String(vessel || "").trim();
  const resolvedPayscaleStatus =
    String(payscaleStatus || "all").trim() || "all";
  const resolvedSalaryHeadState =
    String(salaryHeadState || "all").trim() || "all";

  const { salaryHead, rows } = await getPayrollSourceRows({
    user,
    salaryHeadId: selectedSalaryHeadId,
    payrollDate: resolvedPayrollDate,
    leaveTypes,
    search: resolvedSearch,
    status: resolvedStatus,
    companyId: resolvedCompanyId,
    rank: resolvedRank,
    vessel: resolvedVessel,
    payscaleStatus: resolvedPayscaleStatus,
    salaryHeadState: resolvedSalaryHeadState,
  });
  const selectedPayrollPeriod = getPayrollPeriodFromMonth(resolvedPayrollDate);

  return {
    salaryHeads,
    companies,
    leaveTypes,
    selectedSalaryHeadId,
    selectedSalaryHeadTitle: salaryHead?.title || "",
    selectedPeriodFrom: selectedPayrollPeriod.periodFrom,
    selectedPeriodTo: selectedPayrollPeriod.periodTo,
    selectedSalaryHeadAllowances: salaryHead?.allowances || [],
    selectedSalaryHeadDeductions: salaryHead?.deductions || [],
    payrollDate: resolvedPayrollDate,
    search: resolvedSearch,
    status: resolvedStatus,
    companyId: resolvedCompanyId,
    rank: resolvedRank,
    vessel: resolvedVessel,
    payscaleStatus: resolvedPayscaleStatus,
    salaryHeadState: resolvedSalaryHeadState,
    isSuperAdmin: isSuperAdmin(user),
    rows,
  };
}

export async function savePayrollRecords({
  user,
  salaryHeadId,
  payrollDate,
  companyId,
  items,
}: SavePayrollRecordsParams) {
  await dbConnect();

  if (!items.length) {
    throw new Error("Select at least one crew to save payroll");
  }

  const resolvedPayrollDate = toPayrollMonthDateString(payrollDate);
  if (!resolvedPayrollDate) {
    throw new Error("Select a payroll month");
  }

  const distinctApplicationIds = Array.from(
    new Set(items.map((item) => item.applicationId).filter(Boolean)),
  );
  const requestedSalaryHeadIds = Array.from(
    new Set(
      items
        .map((item) =>
          item.salaryHeadId === undefined
            ? String(salaryHeadId || "")
            : String(item.salaryHeadId || ""),
        )
        .filter(Boolean),
    ),
  );
  const salaryHeadMap = await getSalaryHeadSnapshotMap(requestedSalaryHeadIds);
  const scopedCompanyObjectId = getResolvedCompanyScope(user, companyId);

  if (isSuperAdmin(user) && !scopedCompanyObjectId) {
    throw new Error("Select a company first");
  }

  const { rows } = await getPayrollSourceRows({
    user,
    salaryHeadId: "",
    payrollDate: resolvedPayrollDate,
    leaveTypes: await getLeaveTypeOptions(scopedCompanyObjectId),
    applicationIds: distinctApplicationIds,
    companyId: scopedCompanyObjectId ? String(scopedCompanyObjectId) : "",
  });

  if (!rows.length) {
    throw new Error("No eligible crew records found for payroll");
  }

  const rowMap = new Map(rows.map((row) => [row.applicationId, row]));
  const companyQuery = scopedCompanyObjectId || getCompanyQuery(user);

  const operations = [];
  const lockedRows: string[] = [];

  for (const item of items) {
    const sourceRow = rowMap.get(item.applicationId);
    if (!sourceRow) continue;

    if (sourceRow.status === "finance_approved") {
      lockedRows.push(sourceRow.crewName);
      continue;
    }

    const requestedSalaryHeadId =
      item.salaryHeadId === undefined
        ? String(salaryHeadId || "")
        : String(item.salaryHeadId || "");
    const requestedSalaryHead = requestedSalaryHeadId
      ? salaryHeadMap.get(requestedSalaryHeadId) || null
      : null;

    if (requestedSalaryHeadId && !requestedSalaryHead) {
      throw new Error(`Salary head not found for ${sourceRow.crewName}`);
    }

    if (requestedSalaryHeadId) {
      const salaryHeadCompanyId = getHydratedSalaryHeadCompanyId(
        requestedSalaryHead,
      );
      if (
        sourceRow.companyId &&
        salaryHeadCompanyId &&
        salaryHeadCompanyId !== sourceRow.companyId
      ) {
        throw new Error(
          `Salary head does not belong to ${sourceRow.companyName || sourceRow.crewName}'s company`,
        );
      }
    }

    const nextRow = buildPayrollRow({
      payrollId: sourceRow.payrollId,
      applicationId: sourceRow.applicationId,
      contractId: sourceRow.contractId,
      salaryHeadId: requestedSalaryHeadId,
      salaryHeadTitle: requestedSalaryHead?.title || "",
      crewName: sourceRow.crewName,
      crewEmail: sourceRow.crewEmail,
      rank: sourceRow.rank,
      vesselName: sourceRow.vesselName,
      companyId: sourceRow.companyId,
      companyName: sourceRow.companyName,
      companyLogo: sourceRow.companyLogo,
      payrollDate: sourceRow.payrollDate,
      periodFrom: sourceRow.periodFrom,
      periodTo: sourceRow.periodTo,
      basic: sourceRow.basic,
      contractOtherAllowance: sourceRow.contractOtherAllowance,
      contractAllowances: sourceRow.contractAllowances,
      salaryHeadAllowances: requestedSalaryHead?.allowances || [],
      salaryHeadDeductions: requestedSalaryHead?.deductions || [],
      editableFields: normalizeEditableFields(item),
      status: "draft",
      crewStatus: sourceRow.crewStatus,
    });

    const companyId =
      companyQuery ||
      (await Candidate.findById(sourceRow.applicationId).select("company").lean())?.company;

    if (!companyId || !mongoose.isValidObjectId(String(companyId))) {
      throw new Error(`Unable to resolve company for ${sourceRow.crewName}`);
    }

    const documentPayload = toPayrollDocument(
      nextRow,
      new mongoose.Types.ObjectId(String(companyId)),
      user.id,
    );

    operations.push({
      updateOne: {
        filter: sourceRow.payrollId
          ? {
            _id: ensureObjectId(sourceRow.payrollId, "payroll"),
            company: new mongoose.Types.ObjectId(String(companyId)),
          }
          : {
            company: new mongoose.Types.ObjectId(String(companyId)),
            applicationId: ensureObjectId(sourceRow.applicationId, "application"),
            month: documentPayload.month,
            year: documentPayload.year,
          },
        update: {
          $set: documentPayload,
          $unset: PAYROLL_SNAPSHOT_FIELDS_TO_UNSET,
        },
        upsert: true,
      },
    });
  }

  if (lockedRows.length) {
    throw new Error(
      `Finance-approved payroll cannot be changed: ${lockedRows.join(", ")}`,
    );
  }

  if (!operations.length) {
    throw new Error("No payroll rows were eligible to save");
  }

  await Payroll.bulkWrite(operations);

  const savedRecords = await Payroll.find({
    applicationId: { $in: distinctApplicationIds.map((id) => new mongoose.Types.ObjectId(id)) },
    payrollDate: {
      $gte: resolvedPayrollDate,
      $lt: new Date(new Date(resolvedPayrollDate).setUTCMonth(new Date(resolvedPayrollDate).getUTCMonth() + 1)),
    },
    deletedAt: null,
  })
    .select("_id applicationId")
    .lean();

  return {
    success: true,
    count: operations.length,
    items: savedRecords.map((record: any) => ({
      applicationId: String(record.applicationId),
      payrollId: String(record._id),
    })),
  };
}

export async function transitionPayrollRecords({
  user,
  ids,
  action,
}: TransitionPayrollRecordsParams) {
  await dbConnect();

  const validIds = ids.filter((id) => mongoose.isValidObjectId(id));
  if (!validIds.length) {
    throw new Error("Select at least one saved payroll record");
  }

  const records = await Payroll.find({
    ...buildScopeQuery(user),
    _id: {
      $in: validIds.map((id) => new mongoose.Types.ObjectId(id)),
    },
  });

  if (!records.length) {
    throw new Error("No payroll records found");
  }

  if (action === "verify") {
    const companyIds = Array.from(
      new Set(
        records
          .map((record) => String(record.company || ""))
          .filter((id) => mongoose.isValidObjectId(id)),
      ),
    );

    const settingsByCompanyId = new Map<string, Awaited<ReturnType<typeof getSettings>>>();
    await Promise.all(
      companyIds.map(async (companyId) => {
        const settings = await getSettings({ companyId });
        settingsByCompanyId.set(companyId, settings);
      }),
    );

    const restrictedCompanyIds = companyIds.filter(
      (companyId) =>
        settingsByCompanyId.get(companyId)?.captainOnlyVerification,
    );

    if (restrictedCompanyIds.length) {
      const canVerifyRestrictedPayroll = canVerifyPayrollForRole({
        role: user.role,
        hasVerifyPermission: true,
        captainOnlyVerification: true,
      });

      if (!canVerifyRestrictedPayroll) {
        throw new Error(
          isCaptainRole(user.role)
            ? "You do not have permission to verify payroll"
            : "Captain-only verification is enabled. Only Captain users can verify payroll.",
        );
      }
    }
  }

  const now = new Date();
  const userObjectId =
    user.id && mongoose.isValidObjectId(user.id)
      ? new mongoose.Types.ObjectId(user.id)
      : null;
  const applicationIds = records.map((record) => record.applicationId);
  const candidates = await Candidate.find({
    _id: { $in: applicationIds },
  })
    .select("firstName lastName")
    .lean();
  const candidateNameMap = new Map(
    candidates.map((candidate: any) => [
      String(candidate._id),
      `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() ||
      String(candidate._id),
    ]),
  );
  const invalidRows: string[] = [];

  for (const record of records) {
    if (action === "verify" && record.status !== "saved") {
      invalidRows.push(
        candidateNameMap.get(String(record.applicationId)) ||
        String(record.applicationId),
      );
      continue;
    }

    if (action === "approve" && record.status !== "captain_verified") {
      invalidRows.push(
        candidateNameMap.get(String(record.applicationId)) ||
        String(record.applicationId),
      );
      continue;
    }

    if (action === "verify") {
      record.status = "captain_verified";
      record.verifiedBy = userObjectId;
      record.verifiedAt = now;
    } else {
      record.status = "finance_approved";
      record.approvedBy = userObjectId;
      record.approvedAt = now;
    }
  }

  if (invalidRows.length) {
    throw new Error(
      action === "verify"
        ? `Only saved payroll can be verified: ${invalidRows.join(", ")}`
        : `Only captain verified payroll can be approved: ${invalidRows.join(", ")}`,
    );
  }

  await Promise.all(records.map((record) => record.save()));
  await Payroll.updateMany(
    {
      _id: { $in: records.map((record) => record._id) },
    },
    {
      $unset: PAYROLL_SNAPSHOT_FIELDS_TO_UNSET,
    },
  );

  return {
    success: true,
    count: records.length,
  };
}

export async function updatePayrollRecord({
  user,
  id,
  input,
}: UpdatePayrollRecordParams) {
  await dbConnect();

  const payroll = await Payroll.findOne(buildScopeQuery(user, id));
  if (!payroll) {
    throw new Error("Payroll record not found");
  }

  const leaveTypes = await getLeaveTypeOptions(
    payroll.company ? String(payroll.company) : getCompanyQuery(user),
  );

  if (payroll.status === "finance_approved") {
    throw new Error("Finance-approved payroll cannot be edited");
  }

  const { rows } = await getPayrollSourceRows({
    user,
    salaryHeadId: payroll.salaryHeadId ? String(payroll.salaryHeadId) : "",
    payrollDate: toPayrollDateString(payroll.payrollDate),
    leaveTypes,
    applicationIds: [String(payroll.applicationId)],
  });

  const sourceRow =
    rows.find((row) => row.payrollId === String(payroll._id)) ||
    rows.find((row) => row.applicationId === String(payroll.applicationId));

  // Fetch company data for the payroll
  const company = payroll.company
    ? await Company.findById(payroll.company).select("name logo").lean()
    : null;

  const baseRow =
    sourceRow ||
    buildPayrollRow({
      payrollId: String(payroll._id),
      applicationId: String(payroll.applicationId),
      contractId: String(payroll.contractId),
      hasActivePayscale: true,
      leaveTypes,
      salaryHeadId: payroll.salaryHeadId ? String(payroll.salaryHeadId) : "",
      salaryHeadTitle: "",
      crewName: "",
      crewEmail: "",
      rank: "",
      vesselName: "—",
      companyId: payroll.company ? String(payroll.company) : undefined,
      companyName: company?.name,
      companyLogo: company?.logo,
      payrollDate: toPayrollDateString(payroll.payrollDate),
      periodFrom: toPayrollDateString(payroll.periodFrom),
      periodTo: toPayrollDateString(payroll.periodTo),
      basic: payroll.basic,
      contractOtherAllowance: payroll.contractOtherAllowance,
      contractAllowances: [],
      salaryHeadAllowances: payroll.salaryHeadAllowances,
      salaryHeadDeductions: payroll.salaryHeadDeductions,
      editableFields: {
        leaveEntries: payroll.leaveEntries.map((entry) => ({
          leaveTypeId: String(entry.leaveTypeId),
          leaveTypeCode: entry.leaveTypeCode,
          leaveTypeName: entry.leaveTypeName,
          leaveTypeMaxDays: entry.leaveTypeMaxDays,
          days: entry.days,
          approvedDays:
            typeof entry.approvedDays === "number" ? entry.approvedDays : null,
          status: entry.status === "pending" ? "pending" : "saved",
        })),
        leaveDays: payroll.leaveDays,
        crewAllowances: payroll.crewAllowances,
        crewDeductions: payroll.crewDeductions,
        bondedStore: payroll.bondedStore,
        cashAdvance: payroll.cashAdvance,
        telDeduction: payroll.telDeduction,
        otherDeductions: payroll.otherDeductions,
        remarks: payroll.remarks,
      },
      status: "saved",
      crewStatus: (sourceRow as any)?.crewStatus || "onboard",
    });
  const hasSalaryHeadInput = Object.prototype.hasOwnProperty.call(
    input,
    "salaryHeadId",
  );
  const requestedSalaryHeadId = hasSalaryHeadInput
    ? String(input.salaryHeadId || "")
    : baseRow.salaryHeadId;
  const requestedSalaryHead = requestedSalaryHeadId
    ? await getSalaryHeadSnapshot(requestedSalaryHeadId)
    : null;
  const defaultPeriod = getPayrollPeriodFromMonth(
    toPayrollDateString(payroll.payrollDate),
  );

  const nextRow = buildPayrollRow({
    payrollId: baseRow.payrollId,
    applicationId: baseRow.applicationId,
    contractId: baseRow.contractId,
    hasActivePayscale: baseRow.hasActivePayscale,
    leaveTypes,
    salaryHeadId: requestedSalaryHeadId,
    salaryHeadTitle: requestedSalaryHead?.title || "",
    crewName: baseRow.crewName,
    crewEmail: baseRow.crewEmail,
    rank: baseRow.rank,
    vesselName: baseRow.vesselName,
    companyId: baseRow.companyId,
    companyName: baseRow.companyName,
    companyLogo: baseRow.companyLogo,
    payrollDate: baseRow.payrollDate,
    periodFrom: baseRow.periodFrom || defaultPeriod.periodFrom,
    periodTo: baseRow.periodTo || defaultPeriod.periodTo,
    basic: baseRow.basic,
    contractOtherAllowance: baseRow.contractOtherAllowance,
    contractAllowances: baseRow.contractAllowances,
    salaryHeadAllowances: requestedSalaryHead?.allowances || [],
    salaryHeadDeductions: requestedSalaryHead?.deductions || [],
    editableFields: {
      leaveEntries: input.leaveEntries ?? baseRow.leaveEntries,
      leaveDays: input.leaveDays ?? baseRow.leaveDays,
      crewAllowances: input.crewAllowances ?? baseRow.crewAllowances,
      crewDeductions: input.crewDeductions ?? baseRow.crewDeductions,
      bondedStore: input.bondedStore ?? baseRow.bondedStore,
      cashAdvance: input.cashAdvance ?? baseRow.cashAdvance,
      telDeduction: input.telDeduction ?? baseRow.telDeduction,
      otherDeductions: input.otherDeductions ?? baseRow.otherDeductions,
      remarks: input.remarks ?? baseRow.remarks,
    },
    status: "saved",
    crewStatus: baseRow.crewStatus,
  });
  const documentPayload = toPayrollDocument(
    nextRow,
    new mongoose.Types.ObjectId(String(payroll.company)),
    user.id,
  );

  await Payroll.updateOne(
    buildScopeQuery(user, id),
    {
      $set: documentPayload,
      $unset: PAYROLL_SNAPSHOT_FIELDS_TO_UNSET,
    },
  );

  return {
    success: true,
  };
}

export async function deletePayrollRecord({
  user,
  id,
}: DeletePayrollRecordParams) {
  await dbConnect();

  const payroll = await Payroll.findOne(buildScopeQuery(user, id));
  if (!payroll) {
    throw new Error("Payroll record not found");
  }

  if (payroll.status === "finance_approved") {
    throw new Error("Finance-approved payroll cannot be deleted");
  }

  payroll.deletedAt = new Date();
  await payroll.save();

  return {
    success: true,
  };
}
