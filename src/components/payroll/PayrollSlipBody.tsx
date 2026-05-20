// src/components/payroll/PayrollSlipBody.tsx
"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";
import { PayrollLeaveTypeOption, PayrollRow } from "@/lib/payroll";
import InkStamp from "@/components/common/InkStamp";
import Badge from "@/components/ui/badge/Badge";

function getStatusBadge(status: PayrollRow["status"]) {
  if (status === "finance_approved")
    return <Badge color="success">Finance Approved</Badge>;
  if (status === "captain_verified")
    return <Badge color="blue">Captain Verified</Badge>;
  if (status === "saved") return <Badge color="warning">Saved</Badge>;
  return <Badge color="gray">Draft</Badge>;
}

interface PayrollSlipBodyProps {
  row: PayrollRow;
  leaveTypes: PayrollLeaveTypeOption[];
  currencyCode?: string;
  currencySettings?: {
    currencyPosition: "left" | "right";
    currencyFormatType: "symbol" | "code";
    currencySpace: boolean;
  };
  /** When true, wraps in the standalone card with salary statement header + seal */
  standalone?: boolean;
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(value: string | Date | undefined) {
  if (!value) return "—";
  const parsed = new Date(value as string);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDayCount(value: number) {
  return `${value}`;
}

export default function PayrollSlipBody({
  row,
  leaveTypes,
  currencyCode = "USD",
  currencySettings,
  standalone = false,
}: PayrollSlipBodyProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const isFinanceApproved = row.status === "finance_approved";
  const approvedAmountClass = (approvedClass: string) =>
    isFinanceApproved ? approvedClass : "text-gray-400 dark:text-gray-500";

  const formatValue = (v: number) => formatCurrency(v, currencyCode, { currencySettings });
  const formatEntryValue = (value: number, type = "amount") =>
    type === "percent" ? `${value}%` : formatValue(value);

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  // ── Earning / Deduction group builders ──────────────────────────────────

  const getProratedSum = (entries: any[], otherAmount: any = null) => {
    let sum = 0;
    if (otherAmount) {
      const isObj = typeof otherAmount === "object" && otherAmount !== null;
      const val = isObj ? otherAmount.value : otherAmount;
      const type = isObj ? otherAmount.type : "amount";
      const numericVal = Number(val) || 0;
      if (type === "percent") sum += (numericVal / 100) * row.basic;
      else sum += numericVal;
    }
    for (const e of entries) {
      if (e.type === "percent") sum += (e.value / 100) * row.basic;
      else sum += Number(e.value) || 0;
    }
    return formatValue(sum * row.prorationFactor);
  };

  const getNonProratedSum = (entries: any[]) => {
    let sum = 0;
    for (const e of entries) {
      if (e.type === "percent") sum += (e.value / 100) * row.basic;
      else sum += Number(e.value) || 0;
    }
    return formatValue(sum);
  };

  const earningGroups = [
    {
      id: "contract",
      label: "Total Contract Allowance",
      total: getProratedSum(row.contractAllowances, row.contractOtherAllowance),
      items: [
        ...(() => {
          const other = row.contractOtherAllowance;
          const isObj = typeof other === "object" && other !== null;
          const val = isObj ? (other as any).value : other;
          const type = isObj ? (other as any).type : "amount";
          const numericVal = Number(val) || 0;
          if (numericVal <= 0) return [];
          return [
            {
              label: "Other Allowance ",
              value: formatEntryValue(numericVal, type),
            },
          ];
        })(),
        ...row.contractAllowances.map((e) => ({
          label: e.label,
          value: formatEntryValue(e.value, e.type),
        })),
      ],
    },
    {
      id: "salaryHead",
      label: "Total Salary Head Allowance",
      total: getProratedSum(row.salaryHeadAllowances),
      items: row.salaryHeadAllowances.map((e) => ({
        label: e.label,
        value: formatEntryValue(e.value, e.type),
      })),
    },
    {
      id: "crew",
      label: "Total Crew Allowance",
      total: getNonProratedSum(row.crewAllowances),
      items: row.crewAllowances.map((e) => ({
        label: e.label,
        value: formatEntryValue(e.value, e.type),
      })),
    },
  ].filter((g) => g.items.length > 0);

  const deductionGroups = [
    {
      id: "salaryHeadDed",
      label: "Total Salary Head Deduction",
      total: getProratedSum(row.salaryHeadDeductions),
      items: row.salaryHeadDeductions.map((e) => ({
        label: e.label,
        value: formatEntryValue(e.value, e.type),
      })),
    },
    {
      id: "crewDed",
      label: "Total Crew Deduction",
      total: getNonProratedSum(row.crewDeductions),
      items: row.crewDeductions.map((e) => ({
        label: e.label,
        value: formatEntryValue(e.value, e.type),
      })),
    },
  ].filter((g) => g.items.length > 0);

  // ── Accordion renderer ───────────────────────────────────────────────────

  const renderAccordionGroup = (
    group: {
      id: string;
      label: string;
      total: string;
      items: { label: string; value: string }[];
    },
    isError = false,
  ) => {
    const isOpen = openGroups[group.id];
    return (
      <div key={group.id} className="mt-1">
        <div
          className="flex justify-between items-center text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors py-1.5"
          onClick={() => toggleGroup(group.id)}
        >
          <div className="flex items-center gap-1.5 -ml-1.5">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 opacity-70" />
            ) : (
              <ChevronRight className="h-4 w-4 opacity-70" />
            )}
            <span>{group.label}</span>
          </div>
          <span
            className={
              isError && parseFloat(group.total.replace(/[^0-9.-]+/g, "")) > 0
                ? `font-medium ${approvedAmountClass("text-error-600 dark:text-error-400")}`
                : approvedAmountClass("")
            }
          >
            {group.total}
          </span>
        </div>
        {isOpen && (
          <div className="mt-1 pl-4 py-1 space-y-2 border-l-2 border-gray-100 dark:border-white/10 ml-0.5">
            {group.items.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400"
              >
                <span>{item.label}</span>
                <span
                  className={`font-medium ${
                    isError
                      ? approvedAmountClass("text-error-600 dark:text-error-400")
                      : approvedAmountClass("text-gray-800 dark:text-gray-300")
                  }`}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Shared section blocks ────────────────────────────────────────────────

  const approvalSection = (
    <div className="border-b border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
      <div className="bg-gray-50/80 dark:bg-white/[0.03] border-b border-gray-200 dark:border-white/10 px-5 py-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Approval
        </h3>
      </div>
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[
          {
            label: "Captain Verification",
            name: row.verifiedByName,
            at: row.verifiedAt,
            pending: "Pending verification",
          },
          {
            label: "Finance Approval",
            name: row.approvedByName,
            at: row.approvedAt,
            pending: "Pending approval",
          },
        ].map(({ label, name, at, pending }) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              {/* <div className={`mt-0.5 rounded-full p-1.5 ${name ? "bg-success-100 text-success-600 dark:bg-success-900/20 dark:text-success-400" : "bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500"}`}>
                <CheckCircle2 className="h-5 w-5" />
              </div> */}
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {label}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {name || pending}
                </p>
                {name && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {formatDateTime(at)}
                  </p>
                )}
              </div>
            </div>
            {name && (
              <InkStamp
                upperText={
                  label === "Captain Verification" ? "CAPTAIN" : "FINANCE"
                }
                centerText={
                  label === "Captain Verification" ? "VERIFIED" : "APPROVED"
                }
                color={label === "Captain Verification" ? "blue" : "success"}
                size={100}
                rotation={-40}
                className="-mr-2"
                repeatCount={3}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const employeeBanner = (
    <div className="bg-gray-50/80 dark:bg-white/[0.03] border-b border-gray-200 dark:border-white/10 px-6 py-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Employee Name", value: row.crewName },
          {
            label: "Rank & Vessel",
            value: `${row.rank || "—"} · ${row.vesselName || "—"}`,
          },
          { label: "Email", value: row.crewEmail || "—", extra: "break-all" },
          { label: "Salary Head", value: row.salaryHeadTitle || "—" },
        ].map(({ label, value, extra }) => (
          <div key={label}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
              {label}
            </p>
            <p
              className={`font-medium text-gray-800 dark:text-gray-200 ${extra ?? ""}`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const earningsDeductionsSection = (
    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-white/10 bg-white dark:bg-white/[0.02]">
      {/* Earnings */}
      <div className="flex flex-col">
        <div className="px-5 py-3 bg-white dark:bg-transparent border-b border-gray-100 dark:border-white/5 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          <span>Earnings</span>
          <span>Amount</span>
        </div>
        <div className="p-5 flex-1 flex flex-col justify-start">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm font-semibold text-gray-900 dark:text-white">
              <span>Basic Wages</span>
              <span className={approvedAmountClass("text-gray-900 dark:text-white")}>{formatValue(row.payableBasic)}</span>
            </div>
            <div className="space-y-1 mt-2">
              {earningGroups.map((g) => renderAccordionGroup(g, false))}
            </div>
          </div>
          <div className="mt-auto pt-6">
            <div className="flex justify-between items-center text-sm font-semibold text-gray-900 dark:text-white pt-3 border-t border-gray-100 dark:border-white/10">
              <span>Total Allowances</span>
              <span className={approvedAmountClass("text-gray-900 dark:text-white")}>{formatValue(row.totalAllowance)}</span>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
          <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            Gross Earnings
          </span>
          <span className={`text-[17px] font-bold ${approvedAmountClass("text-success-600 dark:text-success-400")}`}>
            {formatValue(row.grossWages)}
          </span>
        </div>
      </div>

      {/* Deductions */}
      <div className="flex flex-col">
        <div className="px-5 py-3 bg-white dark:bg-transparent border-b border-gray-100 dark:border-white/5 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          <span>Deductions</span>
          <span>Amount</span>
        </div>
        <div className="p-5 flex-1 flex flex-col justify-start">
          {deductionGroups.length > 0 ? (
            <div className="space-y-1">
              {deductionGroups.map((g) => renderAccordionGroup(g, true))}
              {row.leaveDeduction > 0 && (
                <div className="flex justify-between items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mt-2 py-1.5 mx-0.5">
                  <span>Leave Deduction</span>
                  <span className={`font-medium ${approvedAmountClass("text-error-600 dark:text-error-400")}`}>
                    {formatValue(row.leaveDeduction)}
                  </span>
                </div>
              )}
            </div>
          ) : row.leaveDeduction > 0 ? (
            <div className="flex justify-between items-center text-sm font-semibold text-gray-700 dark:text-gray-300 border-t border-gray-100/50 dark:border-white/5 pb-1">
              <span>Leave Deduction</span>
              <span className={`font-medium ${approvedAmountClass("text-error-600 dark:text-error-400")}`}>
                {formatValue(row.leaveDeduction)}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-sm text-gray-400 dark:text-gray-500 italic">
              No deductions for this period
            </div>
          )}
          <div className="mt-auto pt-6" aria-hidden="true" />
        </div>
        <div className="px-5 py-4 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
          <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            Total Deductions
          </span>
          <span className={`text-[17px] font-bold ${approvedAmountClass("text-error-600 dark:text-error-400")}`}>
            {formatValue(row.totalDeductions)}
          </span>
        </div>
      </div>
    </div>
  );

  const netPayableSection = (
    <div
      className={`border-t px-6 py-5 flex items-center justify-between ${
        isFinanceApproved
          ? "bg-gradient-to-r from-success-50 to-success-100/50 border-success-200 dark:from-success-900/20 dark:to-success-800/10 dark:border-success-900/50"
          : "bg-gray-50/80 border-gray-200 dark:bg-white/[0.03] dark:border-white/10"
      }`}
    >
      <p className={`text-sm font-bold uppercase tracking-widest ${approvedAmountClass("text-success-800 dark:text-success-400")}`}>
        Net Payable Information
      </p>
      <p className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${approvedAmountClass("text-success-700 dark:text-success-400")}`}>
        {formatValue(row.netPayable)}
      </p>
    </div>
  );

  const leaveRegisterSection = (
    <div className="border-t border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
      <div className="bg-gray-50/80 dark:bg-white/[0.03] border-b border-gray-200 dark:border-white/10 px-5 py-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Leave Register & Summary
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-[520px]">
          <thead>
            <tr className="bg-white dark:bg-transparent border-b border-gray-100 dark:border-white/5">
              <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">
                Leave Type
              </th>
              <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-center">
                Max Policy Leave
              </th>
              <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-center">
                Leave Taken
              </th>
              <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-center">
                Approved Days
              </th>
              <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-300 text-right">
                Deducted Days
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {leaveTypes.map((leaveType) => {
              const entry = row.leaveEntries.find(
                (item) => item.leaveTypeId === leaveType.id,
              );
              const leaveDays = entry?.days || 0;
              const maxPolicyLeave = entry?.leaveTypeMaxDays ?? leaveType.maxDays;
              const approvedPaidDays = Math.min(
                leaveDays,
                entry?.approvedDays ??
                  entry?.leaveTypeMaxDays ??
                  leaveType.maxDays,
              );
              const deductedDays = Math.max(0, leaveDays - approvedPaidDays);
              return (
                <tr
                  key={leaveType.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">
                    {leaveType.name}
                  </td>
                  <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">
                    {formatDayCount(maxPolicyLeave)}
                  </td>
                  <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">
                    {formatDayCount(leaveDays)}
                  </td>
                  <td className="px-5 py-3 text-center text-gray-600 dark:text-gray-400">
                    {formatDayCount(approvedPaidDays)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={
                        deductedDays > 0
                          ? "font-semibold text-error-600 dark:text-error-400"
                          : "font-medium text-success-600 dark:text-success-400"
                      }
                    >
                      {formatDayCount(deductedDays)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/10 p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          {
            label: "Total Leave Days",
            value: formatDayCount(row.leaveDays),
            cls: "text-gray-900 dark:text-white",
          },
          {
            label: "Deductible Leave Days",
            value: formatDayCount(row.deductibleLeaveDays),
            cls: "text-error-600 dark:text-error-400",
          },
          {
            label: "Payable Days",
            value: formatDayCount(row.payableDays),
            cls: "text-gray-900 dark:text-white",
          },
          {
            label: "Total Month Days",
            value: formatDayCount(row.payrollMonthDays),
            cls: "text-gray-700 dark:text-gray-300",
          },
          {
            label: "Per Day Rate",
            value: formatValue(row.perDayRate),
            cls: approvedAmountClass("text-gray-700 dark:text-gray-300"),
          },
          {
            label: "Leave Deduction",
            value: formatValue(row.leaveDeduction),
            cls: approvedAmountClass("text-error-600 dark:text-error-400"),
          },
        ].map(({ label, value, cls }) => (
          <div key={label}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              {label}
            </p>
            <p className={`text-sm font-semibold mt-1 ${cls}`}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const remarksSection = row.remarks ? (
    <div className="border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] p-5">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
        Remarks
      </h3>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        {row.remarks}
      </p>
    </div>
  ) : null;

  // ── Standalone mode (used inside PayrollViewModal) ───────────────────────
  // Adds the "Salary Statement" header, period, status badge, and wraps
  // everything in the rounded card that ViewModal uses.

  if (standalone) {
    // import Badge + getStatusBadge inline — only needed in standalone mode
    const StatusBadge = () => {
      const { status } = row;
      // Inline to avoid pulling Badge into the shared layer unnecessarily;
      // ViewModal already imported it before — keeping this self-contained.
      return null; // replaced below with the real badge via a prop pattern
    };

    return (
      <div className="space-y-6 text-gray-800 dark:text-gray-200">
        {/* Header */}
        <div className="space-y-1.5">
         
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Salary Statement
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Payroll window:{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {formatDate(row.periodFrom)} to {formatDate(row.periodTo)}
              </span>
            </p>
            {getStatusBadge(row.status)}
          </div>
        </div>

        {/* Approval standalone card */}
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] overflow-hidden">
          {approvalSection}
        </div>

        {/* Main payslip card */}
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] overflow-hidden">
          {employeeBanner}
          {earningsDeductionsSection}
          {netPayableSection}
        </div>

        {/* Leave register standalone card */}
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] overflow-hidden">
          {leaveRegisterSection}
        </div>

        {/* Remarks */}
        {row.remarks && (
          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] p-5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
              Remarks
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {row.remarks}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Inline mode (used inside PayrollBatchConfirmModal expanded row) ──────
  // No outer card — rendered flush inside the card that the batch modal owns.

  return (
    <div className="border-t border-gray-100 dark:border-white/5">
      {approvalSection}
      {employeeBanner}
      {earningsDeductionsSection}
      {netPayableSection}
      {leaveRegisterSection}
      {remarksSection}
    </div>
  );
}
