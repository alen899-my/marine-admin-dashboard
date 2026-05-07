"use client";

import { useState } from "react";
import { HiOutlineDownload } from "react-icons/hi";
import { PayrollRow, PayrollLeaveTypeOption } from "@/lib/payroll";
import Button from "../ui/button/Button";
import { toast } from "react-toastify";

interface DownloadPayrollPdfProps {
  row: PayrollRow;
  leaveTypes: PayrollLeaveTypeOption[];
  currencyCode?: string;
  currencySettings?: {
    currencyPosition: "left" | "right";
    currencyFormatType: "symbol" | "code";
    currencySpace: boolean;
  };
  buttonLabel?: string;
  disabled?: boolean;
}

export default function DownloadPayrollPdf({
  row,
  leaveTypes,
  currencyCode = "USD",
  currencySettings,
  buttonLabel = "Download PDF",
  disabled = false,
}: DownloadPayrollPdfProps) {
  const [loading, setLoading] = useState(false);

  const generatePdf = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/payroll/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ row, leaveTypes, currencyCode, currencySettings }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Payslip_${row.crewName.replace(/\s+/g, "_")}_${row.periodTo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("PDF generated successfully");
    } catch (err) {
      console.error("PDF Generation failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={generatePdf}
      disabled={loading || disabled}
      variant="outline"
      size="sm"
    >
      <HiOutlineDownload
        size={18}
        className={loading || disabled ? "text-gray-400" : "text-brand-500"}
      />
      <span>{loading ? "Generating..." : buttonLabel}</span>
    </Button>
  );
}
