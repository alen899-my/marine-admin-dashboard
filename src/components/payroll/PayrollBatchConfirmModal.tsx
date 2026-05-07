// src/components/payroll/PayrollBatchConfirmModal.tsx
"use client";
import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import { formatCurrency } from "@/lib/formatCurrency";
import { PayrollLeaveTypeOption, PayrollRow } from "@/lib/payroll";
import PayrollSlipBody from "./PayrollSlipBody";

interface PayrollBatchConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
  loading: boolean;
  action: "verify" | "approve";
  rows: PayrollRow[];
  leaveTypes: PayrollLeaveTypeOption[];
  currencyCode?: string;
  currencySettings?: {
    currencyPosition: "left" | "right";
    currencyFormatType: "symbol" | "code";
    currencySpace: boolean;
  };
}

export default function PayrollBatchConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  action,
  rows,
  leaveTypes,
  currencyCode = "USD",
  currencySettings,
}: PayrollBatchConfirmModalProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [skipPending, setSkipPending] = useState(false);
  const [unselectedRowIds, setUnselectedRowIds] = useState<Set<string>>(new Set());

  const formatValue = (value: number) => formatCurrency(value, currencyCode, { currencySettings });

  const rowsWithPendingLeaves = rows.filter((r) =>
    r.leaveEntries.some((l) => l.status === "pending"),
  );
  const hasPendingLeaves = rowsWithPendingLeaves.length > 0;

  // ── Pending leave logic — untouched ─────────────────────────────────────

  const handleSkipPendingToggle = (checked: boolean) => {
    setSkipPending(checked);
    if (checked) {
      setUnselectedRowIds((prev) => {
        const next = new Set(prev);
        rowsWithPendingLeaves.forEach((r) => { if (r.payrollId) next.add(r.payrollId); });
        return next;
      });
    } else {
      setUnselectedRowIds((prev) => {
        const next = new Set(prev);
        rowsWithPendingLeaves.forEach((r) => { if (r.payrollId) next.delete(r.payrollId); });
        return next;
      });
    }
  };

  const handleConfirmClick = () => {
    const selectedIds = rows
      .filter((r) => r.payrollId && !unselectedRowIds.has(r.payrollId))
      .map((r) => r.payrollId as string);
    onConfirm(selectedIds);
  };

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRowSelection = (id: string, checked: boolean) => {
    setUnselectedRowIds((prev) => {
      const next = new Set(prev);
      if (checked) next.delete(id);
      else next.add(id);
      if (hasPendingLeaves) {
        const allPendingSkipped = rowsWithPendingLeaves.every(
          (r) => r.payrollId && next.has(r.payrollId),
        );
        setSkipPending(allPendingSkipped);
      }
      return next;
    });
  };

  const selectedRows = rows.filter((r) => r.payrollId && !unselectedRowIds.has(r.payrollId));
  const totalAmount = selectedRows.reduce((sum, row) => sum + row.netPayable, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[800px] lg:max-w-[1000px] p-4 sm:p-6 lg:p-8"
    >
      {/* Header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h4 className="text-base sm:text-lg font-medium text-gray-800 dark:text-white/90">
          Confirm {action === "verify" ? "Verification" : "Approval"}
        </h4>
      </div>

      {hasPendingLeaves && (
        <div className="mb-5">
          <Alert
            variant="warning"
            title={`${rowsWithPendingLeaves.length} crew ${rowsWithPendingLeaves.length === 1 ? "member has" : "members have"} pending leave entries.`}
            message="Please ensure these are resolved before proceeding, or you can choose to skip them."
          >
            <div className="mt-4 w-fit">
              <Checkbox
                checked={skipPending}
                onChange={handleSkipPendingToggle}
                label={`Skip ${rowsWithPendingLeaves.length} pending crew ${rowsWithPendingLeaves.length === 1 ? "member" : "members"}`}
              />
            </div>
          </Alert>
        </div>
      )}

      {/* Body */}
      <div className="max-h-[65vh] overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5 dark:border-white/10 dark:bg-gray-800">
        <div className="space-y-4">
          {rows.map((row) => {
            const isExpanded = expandedRows[row.applicationId];

            return (
              <div
                key={row.applicationId}
                className={`overflow-hidden rounded-xl border transition-all duration-300 ${
                  isExpanded
                    ? "border-brand-200 bg-white ring-1 ring-brand-500/10 dark:bg-white/[0.04] dark:border-white/20"
                    : "border-gray-200 bg-white dark:bg-white/[0.02] dark:border-white/5 hover:border-gray-300 shadow-sm"
                } ${unselectedRowIds.has(row.payrollId!) ? "opacity-35 grayscale" : ""}`}
              >
                {/* Row header — unchanged */}
                <div
                  className="p-4 cursor-pointer flex items-center justify-between gap-4 group"
                  onClick={(e) => toggleRow(row.applicationId, e)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center p-1" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={!unselectedRowIds.has(row.payrollId!)}
                        onChange={(checked) => toggleRowSelection(row.payrollId!, checked)}
                      />
                    </div>
                    <div className={`p-2 rounded-lg transition-colors ${isExpanded ? "bg-brand-500 text-white" : "bg-gray-100 dark:bg-white/5 text-gray-400 group-hover:bg-brand-50"}`}>
                      {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">{row.crewName}</p>
                        {row.leaveEntries.some((l) => l.status === "pending") && (
                          <Badge color="error" size="sm">Pending Leaves</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-tight mt-1">
                        {row.rank} • {row.vesselName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 sm:gap-8 lg:gap-10">
                    <div className="hidden sm:flex flex-col items-end">
                      <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest leading-none mb-1.5">Gross Wages</p>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatValue(row.grossWages)}</p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end">
                      <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest leading-none mb-1.5">Total Deductions</p>
                      <p className="text-sm font-bold text-error-600 dark:text-error-400 whitespace-nowrap">-{formatValue(row.totalDeductions)}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] leading-none mb-1.5">Net Payable</p>
                      <p className="text-xl font-black text-success-600 dark:text-success-400 whitespace-nowrap">{formatValue(row.netPayable)}</p>
                    </div>
                  </div>
                </div>

                {/* Expanded detail — now a single line */}
                {isExpanded && (
                  <PayrollSlipBody
                    row={row}
                    leaveTypes={leaveTypes}
                    currencyCode={currencyCode}
                    currencySettings={currencySettings}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer — unchanged */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-gray-100 dark:border-white/5 pt-6">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2 whitespace-nowrap">Selected Records</p>
            <p className="text-xl font-black text-gray-900 dark:text-white leading-none">{selectedRows.length} / {rows.length}</p>
          </div>
          <div className="h-10 w-px bg-gray-200 dark:bg-white/10" />
          <div className="flex flex-col">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2 whitespace-nowrap">Total Batch Net Value</p>
            <p className="text-2xl font-black text-brand-600 dark:text-brand-400 leading-none whitespace-nowrap">{formatValue(totalAmount)}</p>
          </div>
        </div>
        <div className="flex items-center justify-end w-full gap-3 mt-6">
          <Button size="sm" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            size="sm"
            variant={action === "approve" ? "success" : "primary"}
            onClick={handleConfirmClick}
            disabled={loading || selectedRows.length === 0}
            className="min-w-[120px]"
          >
            {loading
              ? action === "verify" ? "Processing..." : "Approving..."
              : `Confirm ${action === "verify" ? "Verify" : "Approve"}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}