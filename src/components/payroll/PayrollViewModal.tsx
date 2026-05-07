// src/components/payroll/PayrollViewModal.tsx
"use client";

import ViewModal from "@/components/common/ViewModal";
import Badge from "@/components/ui/badge/Badge";
import { PayrollLeaveTypeOption, PayrollRow } from "@/lib/payroll";
import PayrollSlipBody from "./PayrollSlipBody";
import DownloadPayrollPdf from "./DownloadPayrollPdf";

interface PayrollViewModalProps {
  leaveTypes: PayrollLeaveTypeOption[];
  row: PayrollRow | null;
  isOpen: boolean;
  onClose: () => void;
  currencyCode?: string;
  currencySettings?: {
    currencyPosition: "left" | "right";
    currencyFormatType: "symbol" | "code";
    currencySpace: boolean;
  };
}

export default function PayrollViewModal({
  leaveTypes,
  row,
  isOpen,
  onClose,
  currencyCode = "USD",
  currencySettings,
}: PayrollViewModalProps) {
  return (
    <ViewModal
      isOpen={isOpen}
      onClose={onClose}
      title={row ? `Payroll: ${row.crewName}` : "Payroll Details"}
      size="lg"
      headerRight={
        row && (
          <div className="flex items-center gap-3">
            <DownloadPayrollPdf
              row={row}
              leaveTypes={leaveTypes}
              currencyCode={currencyCode}
              currencySettings={currencySettings}
            />
          </div>
        )
      }
    >
      {row && (
        <PayrollSlipBody
          row={row}
          leaveTypes={leaveTypes}
          currencyCode={currencyCode}
          currencySettings={currencySettings}
          standalone
        />
      )}
    </ViewModal>
  );
}