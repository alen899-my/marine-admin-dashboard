"use client";

import { useState } from "react";
import { HiOutlineDownload } from "react-icons/hi";
import { PayrollRow, PayrollLeaveTypeOption } from "@/lib/payroll";
import Button from "../ui/button/Button";
import { generatePayrollHtml } from "@/lib/payroll-pdf-template";

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
      const html = generatePayrollHtml(row, leaveTypes, currencyCode, currencySettings);

      const printWindow = window.open("", "_blank");
      if (!printWindow) throw new Error("Failed to open print window");

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payslip_${row.crewName?.replace(/\s+/g, "_") || "Payroll"}_${row.periodTo}</title>
          <style>
            @page { size: A4; margin: 12mm; }
            @media print {
              @page { size: A4; margin: 12mm; }
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
          </style>
        </head>
        <body>${html}</body>
        </html>
      `);

      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          setLoading(false);
        }, 500);
      };

    } catch (err) {
      console.error("PDF Generation failed:", err);
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
