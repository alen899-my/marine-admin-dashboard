"use client";

import * as XLSX from "xlsx-js-style";
import Button from "../ui/button/Button";

interface ExportToExcelProps {
  data: any[];
  fileName: string;
  sheetName?: string;
  exportMap?: (item: any) => Record<string, any>;
}

export default function ExportToExcel({
  data,
  fileName,
  sheetName = "Report",
  exportMap,
}: ExportToExcelProps) {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    // 1. Prepare data
    const formattedData = exportMap ? data.map(exportMap) : data;

    // 2. Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // 3. --- SPECIFIC CELL SPACING FOR HEADERS ---
    const objectKeys = Object.keys(formattedData[0]);
    const colWidths = objectKeys.map((key) => {
      const headerText = key.toString();

      // Calculate max length of data in this column
      const maxCellLen = formattedData.reduce((max, row) => {
        const cellValue = row[key]?.toString() || "";
        return Math.max(max, cellValue.length);
      }, 0);

      /**
       * Spacing Logic:
       * - Header width needs more padding because it is BOLD.
       * - We ensure the column is at least as wide as the header + extra space.
       */
      const headerWidth = headerText.length + 8; // Extra breathing room for bold text
      const dataWidth = maxCellLen + 2;

      return { wch: Math.max(headerWidth, dataWidth) };
    });

    worksheet["!cols"] = colWidths;

    // 4. --- STYLE HEADERS ---
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (!worksheet[address]) continue;

      worksheet[address].s = {
        font: {
          bold: true,
          color: { rgb: "1F2937" }, // Slate 800
          name: "Arial",
          sz: 11, // Font size 11
        },
        fill: {
          fgColor: { rgb: "F3F4F6" },
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          /** Important: Ensure text doesn't touch the edges */
          padding: { left: 2, right: 2 },
        },
        border: {
          bottom: { style: "medium", color: { rgb: "D1D5DB" } },
        },
      };
    }

    // 5. Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // 6. Download file
    const safeFileName = fileName.replace(/\s+/g, "_").toLowerCase();
    XLSX.writeFile(
      workbook,
      `${safeFileName}_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  return (
    <Button
      variant="outline"
      size="md"
      type="button"
      onClick={handleExport}
      disabled={!data || data.length === 0}
      startIcon={
        <img
          src="/images/icons/xls.png"
          alt="Excel"
          className="h-6 w-6 object-contain"
        />
      }
    >
      Export Excel
    </Button>
  );
}
