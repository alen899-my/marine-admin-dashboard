"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { BadgeCheck, CheckCircle2, Plus, Trash2 } from "lucide-react";
import ComponentCard from "@/components/common/ComponentCard";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import ConfirmApprovalModal from "@/components/common/ConfirmApprovalModal";
import ExportToExcel from "@/components/common/ExportToExcel";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import MonthYearPicker from "@/components/common/MonthYearPicker";
import TableCount from "@/components/common/TableCount";
import SearchableSelect from "@/components/form/SearchableSelect";
import Button from "@/components/ui/button/Button";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import {
  applyPayrollEditableFields,
  PayrollEditableFields,
  PayrollLeaveTypeOption,
  PayrollRow,
  getPayrollRowKey,
} from "@/lib/payroll";
import { canVerifyPayrollForRole } from "@/lib/payrollVerificationAccess";
import PayrollTable from "./PayrollTable";
import PayrollViewModal from "@/components/payroll/PayrollViewModal";
import PayrollEditModal from "@/components/payroll/PayrollEditModal";
import { payrollItemSchema } from "@/lib/validations/payrollSchema";
import PayrollFilterWrapper from "./PayrollFilterWrapper";
import PayrollBatchConfirmModal from "@/components/payroll/PayrollBatchConfirmModal";
import { formatCurrency } from "@/lib/formatCurrency";

type CurrencySettings = {
  currencyPosition: "left" | "right";
  currencyFormatType: "symbol" | "code";
  currencySpace: boolean;
};

interface SalaryHeadOption {
  id: string;
  title: string;
  periodFrom: string;
  periodTo: string;
}

interface PayrollPageClientProps {
  companies: Array<{ id: string; name: string }>;
  salaryHeads: SalaryHeadOption[];
  leaveTypes: PayrollLeaveTypeOption[];
  rows: PayrollRow[];
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
  payrollCaptainOnlyVerification: boolean;
  currencyCode?: string;
  currencySettings?: CurrencySettings;
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// formatCurrency from lib is imported at the top

function formatPayrollMonthLabel(value: string) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function joinEntries(
  entries: Array<{ label: string; value: number; type?: "amount" | "percent" }>,
  currency: string = "USD",
  currencySettings?: CurrencySettings
) {
  if (!entries.length) return "-";
  return entries
    .map((entry) => {
      const displayValue =
        entry.type === "percent"
          ? `${entry.value}%`
          : formatCurrency(entry.value || 0, currency, { currencySettings });
      return `${entry.label}: ${displayValue}`;
    })
    .join(", ");
}

function sumEntryValues(entries: Array<{ value: number }>) {
  return Number(
    entries
      .reduce((sum, entry) => sum + Number(entry.value || 0), 0)
      .toFixed(2),
  );
}

function getPayrollMonthParts(value: string) {
  const [yearPart, monthPart] = value.split("-").map(Number);
  const now = new Date();
  return {
    month:
      monthPart && monthPart >= 1 && monthPart <= 12
        ? monthPart
        : now.getMonth() + 1,
    year: yearPart || now.getFullYear(),
  };
}

function toPayrollMonthQueryValue(month: number, year: number) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
}

export default function PayrollPageClient({
  companies,
  salaryHeads,
  leaveTypes,
  rows,
  selectedSalaryHeadId,
  selectedSalaryHeadTitle,
  selectedPeriodFrom: _selectedPeriodFrom,
  selectedPeriodTo: _selectedPeriodTo,
  selectedSalaryHeadAllowances: _selectedSalaryHeadAllowances,
  selectedSalaryHeadDeductions: _selectedSalaryHeadDeductions,
  payrollDate,
  companyId,
  isSuperAdmin,
  payrollCaptainOnlyVerification,
  currencyCode = "USD",
  currencySettings,
}: PayrollPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can, isReady, user } = useAuthorization();
  const { isFilterVisible, setIsFilterVisible } =
    useFilterPersistence("payroll");

  // Currency formatter - uses the common formatCurrency from lib
  const formatValue = useCallback(
    (value: number) => formatCurrency(value, currencyCode, { currencySettings }),
    [currencyCode, currencySettings],
  );

  void _selectedPeriodFrom;
  void _selectedPeriodTo;
  void _selectedSalaryHeadAllowances;
  void _selectedSalaryHeadDeductions;

  const canView = can("payroll.view");
  const canCreate = can("payroll.create");
  const canEdit = can("payroll.edit");
  const canDelete = can("payroll.delete");
  const canVerify = can("payroll.verify");
  const canApprove = can("payroll.approve");
  const canVerifyByRole = canVerifyPayrollForRole({
    role: user?.role,
    hasVerifyPermission: canVerify,
    captainOnlyVerification: payrollCaptainOnlyVerification,
  });
  const requiresCompanySelection = isSuperAdmin && !companyId;
  

  const [localRows, setLocalRows] = useState(rows);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [activeAction, setActiveAction] = useState<
    "apply" | "verify" | "approve" | null
  >(null);
  const [viewRow, setViewRow] = useState<PayrollRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<PayrollRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [batchActionRows, setBatchActionRows] = useState<PayrollRow[]>([]);
  const [batchActionType, setBatchActionType] = useState<
    "verify" | "approve" | null
  >(null);
  const [showApprovalWarning, setShowApprovalWarning] = useState(false);
  const [entryQueue, setEntryQueue] = useState<string[]>([]);
  const [entryQueueIndex, setEntryQueueIndex] = useState(0);
  const [entrySaving, setEntrySaving] = useState(false);
  const [entryErrors, setEntryErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalRows(rows);
    setSelectedKeys((prev) => {
      const rowKeys = new Set(rows.map((row) => getPayrollRowKey(row)));
      return prev.filter((key) => rowKeys.has(key));
    });
  }, [rows]);

  const selectedRows = useMemo(
    () =>
      localRows.filter((row) => selectedKeys.includes(getPayrollRowKey(row))),
    [localRows, selectedKeys],
  );

  const salaryHeadOptions = salaryHeads.map((item) => ({
    value: item.id,
    label: `${item.title} `,
  }));
  const salaryHeadDropdownOptions = [...salaryHeadOptions];
  const rankOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => row.rank.trim())
            .filter(Boolean),
        ),
      )
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value })),
    [rows],
  );
  const vesselOptions = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => row.vesselName.trim())
            .filter((value) => value && value !== "—"),
        ),
      )
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value })),
    [rows],
  );

  const { month: selectedMonth, year: selectedYear } = useMemo(
    () => getPayrollMonthParts(payrollDate),
    [payrollDate],
  );
  const activeEntryApplicationId = entryQueue[entryQueueIndex] || null;
  const activeEntryRow =
    localRows.find((row) => row.applicationId === activeEntryApplicationId) ??
    null;
  const nextEntryRow =
    localRows.find(
      (row) => row.applicationId === entryQueue[entryQueueIndex + 1],
    ) ?? null;
  const exportRows = useMemo(
    () => (selectedRows.length ? selectedRows : localRows),
    [localRows, selectedRows],
  );
  const payrollExcelMapping = useMemo(
    () => (row: PayrollRow) => {
      const leaveColumns = leaveTypes.reduce<Record<string, string | number>>(
        (acc, leaveType) => {
          const entry = row.leaveEntries.find(
            (item) => item.leaveTypeId === leaveType.id,
          );
          acc[`Leave - ${leaveType.name}`] = entry?.days || 0;
          acc[`Approved Paid Leave - ${leaveType.name}`] =
            entry?.approvedDays ?? entry?.leaveTypeMaxDays ?? leaveType.maxDays;
          return acc;
        },
        {},
      );

      return {
        "Crew Name": row.crewName || "-",
        "Crew Email": row.crewEmail || "-",
        Rank: row.rank || "-",
        Vessel: row.vesselName || "-",
        "Salary Head": row.salaryHeadTitle || "-",
        "Payroll Month": formatPayrollMonthLabel(row.payrollDate),
        "Period From": formatDate(row.periodFrom),
        "Period To": formatDate(row.periodTo),
        "Payroll Days": row.payableDays,
        "Month Days": row.payrollMonthDays,
        Status: row.status.replaceAll("_", " "),
        "Basic Wages": formatValue(row.payableBasic),
        "Contract Other Allowance": (() => {
          const other = row.contractOtherAllowance;
          if (typeof other === "object" && other !== null) {
            return other.type === "percent"
              ? `${other.value}%`
              : formatValue(other.value);
          }
          return formatValue(other || 0);
        })(),
        "Contract Allowance Breakdown": joinEntries(
          row.contractAllowances,
          currencyCode,
          currencySettings
        ),
        "Salary Head Allowance Breakdown": joinEntries(
          row.salaryHeadAllowances,
          currencyCode,
          currencySettings
        ),
        "Crew Allowance Breakdown": joinEntries(
          row.crewAllowances,
          currencyCode,
          currencySettings
        ),
        "Salary Head Deduction Breakdown": joinEntries(
          row.salaryHeadDeductions,
          currencyCode,
          currencySettings
        ),
        "Total Allowance": formatValue(row.totalAllowance),
        "Gross Wages": formatValue(row.grossWages),
        ...leaveColumns,
        "Total Leave Days": row.leaveDays,
        "Deductible Leave Days": row.deductibleLeaveDays,
        "Per Day Rate": formatValue(row.perDayRate),
        "Leave Deduction": formatValue(row.leaveDeduction),
        "Salary Head Deduction Total": formatValue(
          sumEntryValues(row.salaryHeadDeductions),
        ),
        "Crew Deduction Breakdown": joinEntries(
          row.crewDeductions,
          currencyCode,
          currencySettings
        ),
        "Total Deductions": formatValue(row.totalDeductions),
        "Net Payable": formatValue(row.netPayable),
        Remarks: row.remarks || "-",
      };
    },
    [leaveTypes, currencyCode, currencySettings, formatValue],
  );

  const handleQueryChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key === "salaryHeadId") {
      params.delete("page");
    }
    router.push(`/payroll?${params.toString()}`);
  };

  const canEditRow = (row: PayrollRow) => {
    if (row.status === "finance_approved") return false;
    return row.payrollId ? canEdit : canCreate;
  };

  const editableSelectedRows = selectedRows.filter((row) => canEditRow(row));
  const selectedRowsWithCurrentSalaryHead = selectedSalaryHeadId
    ? editableSelectedRows.filter(
        (row) => row.salaryHeadId === selectedSalaryHeadId,
      )
    : [];
  const shouldRemoveSelectedSalaryHead =
    Boolean(selectedSalaryHeadId) &&
    editableSelectedRows.length > 0 &&
    selectedRowsWithCurrentSalaryHead.length === editableSelectedRows.length;

  const updateRowLocally = (
    applicationId: string,
    values: PayrollEditableFields,
    payrollId?: string,
  ) => {
    setLocalRows((prev) =>
      prev.map((row) => {
        if (row.applicationId !== applicationId) return row;
        return {
          ...applyPayrollEditableFields(row, values),
          payrollId: payrollId || row.payrollId,
          status: "saved",
        };
      }),
    );
    if (payrollId) {
      setSelectedKeys((prev) =>
        prev.map((key) => (key === applicationId ? payrollId : key)),
      );
    }
  };

  const closeEntryModal = (refresh = false) => {
    setEntryQueue([]);
    setEntryQueueIndex(0);
    setEntryErrors({});
    setEntrySaving(false);
    if (refresh) router.refresh();
  };

  const openEntryModalForRows = (targetRows: PayrollRow[]) => {
    if (requiresCompanySelection) {
      toast.error("Select a company first");
      return;
    }

    const editableRows = targetRows.filter((row) => canEditRow(row));
    if (!editableRows.length) {
      toast.error("Select at least one editable payroll row");
      return;
    }
    const rowsWithoutSalaryHead = editableRows.filter(
      (row) => !row.salaryHeadId,
    );
    if (rowsWithoutSalaryHead.length > 0) {
      toast.error("Choose salary head first");
      return;
    }
    setEntryQueue(editableRows.map((row) => row.applicationId));
    setEntryQueueIndex(0);
    setEntryErrors({});
  };

  const openSelectedEntryModal = () => openEntryModalForRows(selectedRows);
  const openSingleEntryModal = (row: PayrollRow) =>
    openEntryModalForRows([row]);

  const handleApplySalaryHeadToSelection = async () => {
    if (requiresCompanySelection) {
      toast.error("Select a company first");
      return;
    }

    const isRemovingSalaryHead =
      !selectedSalaryHeadId || shouldRemoveSelectedSalaryHead;
    const targetRows = isRemovingSalaryHead
      ? editableSelectedRows.filter((row) =>
          selectedSalaryHeadId
            ? row.salaryHeadId === selectedSalaryHeadId
            : Boolean(row.salaryHeadId),
        )
      : editableSelectedRows;

    if (!editableSelectedRows.length) {
      toast.error("Select at least one editable crew row");
      return;
    }
    if (!targetRows.length) {
      toast.error("Selected crew do not have a salary head to remove");
      return;
    }

    setActiveAction("apply");
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salaryHeadId: isRemovingSalaryHead ? "" : selectedSalaryHeadId,
          companyId,
          payrollDate,
          items: targetRows.map((row) => ({
            applicationId: row.applicationId,
            salaryHeadId: isRemovingSalaryHead ? "" : selectedSalaryHeadId,
            leaveEntries: row.leaveEntries,
            leaveDays: row.leaveDays,
            crewAllowances: row.crewAllowances,
            crewDeductions: row.crewDeductions,
            bondedStore: row.bondedStore,
            cashAdvance: row.cashAdvance,
            telDeduction: row.telDeduction,
            otherDeductions: row.otherDeductions,
            remarks: row.remarks,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(
          data?.error ||
            (isRemovingSalaryHead
              ? "Failed to remove salary head"
              : "Failed to apply salary head"),
        );
        return;
      }
      toast.success(
        isRemovingSalaryHead
          ? `Salary head removed from ${data?.count || targetRows.length} crew`
          : `Salary head applied to ${data?.count || targetRows.length} crew`,
      );
      router.refresh();
    } catch {
      toast.error(
        isRemovingSalaryHead
          ? "Failed to remove salary head"
          : "Failed to apply salary head",
      );
    } finally {
      setActiveAction(null);
    }
  };

  const handleEntrySave = async (
    values: {
      leaveEntries: PayrollRow["leaveEntries"];
      crewAllowances: PayrollRow["crewAllowances"];
      crewDeductions: PayrollRow["crewDeductions"];
      bondedStore: number | null;
      cashAdvance: number | null;
      telDeduction: number | null;
      otherDeductions: number | null;
      remarks: string;
    },
    options: { moveNext: boolean },
  ) => {
    if (!activeEntryRow) return;
    if (requiresCompanySelection) {
      toast.error("Select a company first");
      return;
    }

    const validationPayload = {
      applicationId: activeEntryRow.applicationId,
      leaveEntries: leaveTypes.map((leaveType) => {
        const entry = values.leaveEntries.find(
          (item) => item.leaveTypeId === leaveType.id,
        );
        return (
          entry || {
            leaveTypeId: leaveType.id,
            leaveTypeCode: leaveType.code,
            leaveTypeName: leaveType.name,
            leaveTypeMaxDays: leaveType.maxDays,
            status: "saved" as const,
            days: null,
            approvedDays: leaveType.maxDays,
          }
        );
      }),
      bondedStore: values.bondedStore,
      cashAdvance: values.cashAdvance,
      telDeduction: values.telDeduction,
      otherDeductions: values.otherDeductions,
      crewAllowances: values.crewAllowances,
      crewDeductions: values.crewDeductions,
      remarks: values.remarks,
    };

    const validation = payrollItemSchema.validate(validationPayload, {
      abortEarly: false,
    });

    if (validation.error) {
      const nextErrors: Record<string, string> = {};
      validation.error.details.forEach((detail) => {
        const [firstPart, secondPart, thirdPart] = detail.path;
        if (
          firstPart === "leaveEntries" &&
          (thirdPart === "days" || thirdPart === "approvedDays")
        ) {
          const entry = validationPayload.leaveEntries[Number(secondPart)];
          if (entry) {
            nextErrors[`leave.${entry.leaveTypeId}`] = detail.message.replace(
              thirdPart === "approvedDays" ? "Approved paid days" : "Days",
              entry.leaveTypeName || "Days",
            );
          }
          return;
        }
        if (firstPart === "crewDeductions") {
          const entry = validationPayload.crewDeductions[Number(secondPart)];
          nextErrors[`crewDeductions.${secondPart}.${thirdPart}`] =
            detail.message.replace(
              "Deduction amount",
              entry?.label || "Deduction",
            );
          return;
        }
        if (firstPart === "crewAllowances") {
          const entry = validationPayload.crewAllowances[Number(secondPart)];
          nextErrors[`crewAllowances.${secondPart}.${thirdPart}`] =
            detail.message.replace(
              "Allowance amount",
              entry?.label || "Allowance",
            );
          return;
        }
        nextErrors[String(firstPart)] = detail.message;
      });
      setEntryErrors(nextErrors);
      toast.error("Please complete all required payroll inputs");
      return;
    }

    setEntrySaving(true);
    setEntryErrors({});

    try {
      const res = activeEntryRow.payrollId
        ? await fetch(`/api/payroll/${activeEntryRow.payrollId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          })
        : await fetch("/api/payroll", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              salaryHeadId: selectedSalaryHeadId,
              companyId,
              payrollDate,
              items: [
                { applicationId: activeEntryRow.applicationId, ...values },
              ],
            }),
          });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to save payroll");
        return;
      }

      const savedPayrollId =
        data?.items?.find(
          (item: { applicationId?: string; payrollId?: string }) =>
            item.applicationId === activeEntryRow.applicationId,
        )?.payrollId || activeEntryRow.payrollId;

      updateRowLocally(activeEntryRow.applicationId, values, savedPayrollId);
      toast.success(
        options.moveNext && nextEntryRow
          ? `${activeEntryRow.crewName} saved. Opening ${nextEntryRow.crewName}.`
          : `Payroll saved for ${activeEntryRow.crewName}`,
      );

      if (options.moveNext && nextEntryRow) {
        setEntryQueueIndex((prev) => prev + 1);
        return;
      }
      closeEntryModal(true);
    } catch {
      toast.error("Failed to save payroll");
    } finally {
      setEntrySaving(false);
    }
  };

  const handleBatchTransition = (action: "verify" | "approve") => {
    if (action === "verify" && !canVerifyByRole) {
      toast.error(
        payrollCaptainOnlyVerification
          ? "Captain-only verification is enabled. Only Captain users can verify payroll."
          : "You do not have permission to verify payroll.",
      );
      return;
    }

    const rowsWithoutSalaryHead = selectedRows.filter(
      (row) => !row.salaryHeadId,
    );
    if (rowsWithoutSalaryHead.length > 0) {
      toast.error("Choose salary head first");
      return;
    }
    const eligibleRows = selectedRows.filter((row) =>
      action === "verify"
        ? row.status === "saved" && Boolean(row.payrollId)
        : row.status === "captain_verified" && Boolean(row.payrollId),
    );
    if (!eligibleRows.length) {
      toast.error(
        action === "verify"
          ? "Select saved payroll rows to verify"
          : "Select captain verified rows to approve",
      );
      return;
    }
    setBatchActionRows(eligibleRows);
    setBatchActionType(action);
  };

  const handleBatchConfirm = async (idsToProcess?: string[]) => {
    if (!batchActionType || !batchActionRows.length) return;

    let targetRows = batchActionRows;
    if (idsToProcess && idsToProcess.length > 0) {
      targetRows = batchActionRows.filter((row) =>
        row.payrollId ? idsToProcess.includes(row.payrollId) : false,
      );
    }
    if (!targetRows.length) {
      toast.error("No valid rows selected");
      return;
    }
    if (batchActionType === "approve" && !showApprovalWarning) {
      setBatchActionRows(targetRows);
      setShowApprovalWarning(true);
      return;
    }

    const action = batchActionType;
    setActiveAction(action);
    try {
      const res = await fetch("/api/payroll", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ids: targetRows.map((row) => row.payrollId),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to update payroll status");
        return;
      }
      toast.success(
        action === "verify"
          ? "Payroll verified by captain"
          : "Payroll approved by finance",
      );
      setBatchActionType(null);
      setBatchActionRows([]);
      setShowApprovalWarning(false);
      router.refresh();
    } catch {
      toast.error("Failed to update payroll status");
    } finally {
      setActiveAction(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteRow?.payrollId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/payroll/${deleteRow.payrollId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to delete payroll");
        return;
      }
      toast.success("Payroll deleted successfully");
      setDeleteRow(null);
      router.refresh();
    } catch {
      toast.error("Failed to delete payroll");
    } finally {
      setDeleteLoading(false);
    }
  };

  const payrollActionButtons = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="w-full sm:w-[280px]">
        <SearchableSelect
          options={salaryHeadDropdownOptions}
          value={selectedSalaryHeadId}
          onChange={(value) => handleQueryChange("salaryHeadId", value)}
          placeholder={
            requiresCompanySelection ? "Select company first" : "Select salary head"
          }
          disabled={requiresCompanySelection}
        />
      </div>

      <Button
        size="sm"
        variant="warning"
        className={
          !selectedSalaryHeadId || shouldRemoveSelectedSalaryHead
            ? "rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:bg-amber-50"
            : "rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:bg-amber-50 dark:bg-orange-600 dark:text-white dark:hover:bg-orange-700"
        }
        onClick={handleApplySalaryHeadToSelection}
        disabled={
          activeAction !== null ||
          entrySaving ||
          requiresCompanySelection ||
          !editableSelectedRows.length
        }
        startIcon={
          !selectedSalaryHeadId || shouldRemoveSelectedSalaryHead ? (
            <Trash2 className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )
        }
      >
        {activeAction === "apply"
          ? !selectedSalaryHeadId || shouldRemoveSelectedSalaryHead
            ? "Removing..."
            : "Applying..."
          : !selectedSalaryHeadId || shouldRemoveSelectedSalaryHead
            ? "Remove Salary Head"
            : "Apply Salary Head"}
      </Button>

      <Button
        size="sm"
        variant="primary"
        className="rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 dark:bg-indigo-600 dark:hover:bg-indigo-700"
        onClick={openSelectedEntryModal}
        disabled={
          activeAction !== null ||
          entrySaving ||
          requiresCompanySelection ||
          !selectedRows.some((row) => canEditRow(row))
        }
        startIcon={<Plus className="h-4 w-4" />}
      >
        Add Entry
      </Button>

      {canVerifyByRole ? (
        <Button
          size="sm"
          className="rounded-lg bg-sky-600 text-sky-700 hover:bg-sky-500 disabled:bg-sky-400 dark:bg-sky-600 dark:text-white dark:hover:bg-sky-700"
          onClick={() => handleBatchTransition("verify")}
          disabled={
            activeAction !== null || requiresCompanySelection || !selectedRows.length
          }
          startIcon={<BadgeCheck className="h-4 w-4" />}
        >
          {activeAction === "verify" ? "Verifying..." : "Verify"}
        </Button>
      ) : null}

      {canApprove ? (
        <Button
          size="sm"
          className="rounded-lg bg-emerald-600 text-emerald-700 hover:bg-emerald-400 disabled:bg-emerald-400 dark:bg-success-600 dark:text-white dark:hover:bg-success-700"
          onClick={() => handleBatchTransition("approve")}
          disabled={
            activeAction !== null || requiresCompanySelection || !selectedRows.length
          }
          startIcon={<CheckCircle2 className="h-4 w-4" />}
        >
          {activeAction === "approve" ? "Approving..." : "Approve"}
        </Button>
      ) : null}
    </div>
  );

  if (!isReady) return null;

  if (!canView) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="font-medium text-gray-500">
          You do not have permission to access Payroll Management.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Payroll Management
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage payroll entries, verification, and approvals.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end xl:justify-end">
            <ExportToExcel
              data={exportRows}
              fileName={`Payroll_${selectedSalaryHeadTitle || payrollDate}`}
              sheetName="Payroll"
              exportMap={payrollExcelMapping}
            />

            <FilterToggleButton
              isVisible={isFilterVisible}
              onToggle={setIsFilterVisible}
            />

            <div className="min-w-[190px]">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Payroll Month
              </label>
              <MonthYearPicker
                month={selectedMonth}
                year={selectedYear}
                onChange={(month, year) =>
                  handleQueryChange(
                    "payrollDate",
                    toPayrollMonthQueryValue(month, year),
                  )
                }
              />
            </div>
          </div>
        </div>

        <ComponentCard
          className="rounded-[24px] border-gray-200 shadow-[0_12px_32px_rgba(15,23,42,0.04)]"
          headerClassName={isFilterVisible ? "p-0" : "px-4 py-4 sm:px-5 sm:py-5"}
          title={
            isFilterVisible ? (
              <PayrollFilterWrapper
                companies={companies}
                isSuperAdmin={isSuperAdmin}
                rankOptions={rankOptions}
                vesselOptions={vesselOptions}
              />
            ) : (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">{payrollActionButtons}</div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <TableCount count={localRows.length} label="payroll rows" />
                  <TableCount count={selectedRows.length} label="selected" />
                </div>
              </div>
            )
          }
        >
          {isFilterVisible ? (
            <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.02]">
              <div className="flex flex-wrap items-center gap-3">
                {payrollActionButtons}
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <TableCount count={localRows.length} label="payroll rows" />
                <TableCount count={selectedRows.length} label="selected" />
              </div>
            </div>
          ) : null}
          <PayrollTable
            rows={localRows}
            selectedKeys={selectedKeys}
            disabled={activeAction !== null || entrySaving}
            canDelete={canDelete}
            canEditRow={canEditRow}
            onToggleSelectAll={(checked: boolean) =>
              setSelectedKeys(
                checked ? localRows.map((row) => getPayrollRowKey(row)) : [],
              )
            }
            onToggleSelectRow={(rowKey: string, checked: boolean) =>
              setSelectedKeys((prev) =>
                checked
                  ? Array.from(new Set([...prev, rowKey]))
                  : prev.filter((key) => key !== rowKey),
              )
            }
            onEdit={openSingleEntryModal}
            onView={setViewRow}
            onDelete={setDeleteRow}
            currencyCode={currencyCode}
            currencySettings={currencySettings}
          />
        </ComponentCard>
      </div>

      <PayrollViewModal
        leaveTypes={leaveTypes}
        row={viewRow}
        currencyCode={currencyCode}
        currencySettings={currencySettings}
        isOpen={Boolean(viewRow)}
        onClose={() => setViewRow(null)}
      />

      <PayrollEditModal
        leaveTypes={leaveTypes}
        currencyCode={currencyCode}
        currencySettings={currencySettings}
        row={activeEntryRow}
        isOpen={Boolean(activeEntryRow)}
        loading={entrySaving}
        currentIndex={entryQueueIndex}
        totalCount={entryQueue.length}
        nextCrewName={nextEntryRow?.crewName || null}
        errors={entryErrors}
        descriptionError={!activeEntryRow?.salaryHeadId}
        onClose={closeEntryModal}
        onSave={handleEntrySave}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deleteRow)}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Payroll"
        description={
          deleteRow
            ? `Delete payroll for ${deleteRow.crewName}?`
            : "Delete this payroll record?"
        }
      />

      {batchActionType && (
        <PayrollBatchConfirmModal
          isOpen={Boolean(batchActionType) && !showApprovalWarning}
          currencyCode={currencyCode}
          currencySettings={currencySettings}
          onClose={() => {
            setBatchActionType(null);
            setBatchActionRows([]);
          }}
          onConfirm={handleBatchConfirm}
          loading={activeAction !== null}
          action={batchActionType}
          rows={batchActionRows}
          leaveTypes={leaveTypes}
        />
      )}

      <ConfirmApprovalModal
        isOpen={showApprovalWarning}
        onClose={() => setShowApprovalWarning(false)}
        onConfirm={handleBatchConfirm}
        loading={activeAction === "approve"}
      />
    </>
  );
}
