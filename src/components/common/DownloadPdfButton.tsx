"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useState } from "react";
import { HiOutlineDownload } from "react-icons/hi"; // Using a download icon
import Button from "../ui/button/Button";

export interface DownloadPdfButtonProps {
  title: string;
  filename: string;
  data: Record<string, any>;
  buttonLabel?: string;
  disabled?: boolean;
}

export default function DownloadPdfButton({
  title,
  filename,
  data,
  buttonLabel = "Download Report",
  disabled = false,
}: DownloadPdfButtonProps) {
  const [loading, setLoading] = useState(false);

  // Helper to load the logo
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
  };

  const generateAndDownload = async () => {
    setLoading(true);

    try {
      const doc = new jsPDF();
      const margin = 14;
      const pageWidth = doc.internal.pageSize.getWidth();

      // -------- 1. HEADER & LOGO LOGIC --------
      let logoBottomY = 25;
      try {
        const logo = await loadImage("/images/logo/b.png");
        const displayWidth = 45;
        const displayHeight = (logo.naturalHeight * displayWidth) / logo.naturalWidth;
        
        doc.addImage(logo, "PNG", margin, 10, displayWidth, displayHeight);
        logoBottomY = 10 + displayHeight;

        // Title and Date Header
        doc.setFontSize(16);
        doc.text(title, pageWidth - margin, 18, { align: "right" });
        doc.setFontSize(9);
        doc.text(
          `Generated: ${new Date().toLocaleString("en-IN")}`, 
          pageWidth - margin, 24, { align: "right" }
        );
      } catch (e) {
        console.warn("Logo failed to load, proceeding with text only", e);
      }

      // -------- 2. TABLE LOGIC --------
      const rows = Object.entries(data).map(([key, value]) => [
        key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
        value !== undefined && value !== null ? String(value) : "-",
      ]);

      autoTable(doc, {
        startY: logoBottomY + 10,
        head: [["Field", "Value"]],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [0, 166, 184] }, // Matches your blue header
      });

      // -------- 3. DIRECT DOWNLOAD --------
      doc.save(`${filename}.pdf`);

    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled = loading || disabled;

  return (
    <Button
      onClick={(e) => { e.stopPropagation(); generateAndDownload(); }}
      disabled={isButtonDisabled}
      variant="outline"
    >
      <HiOutlineDownload 
        size={18} 
        className={isButtonDisabled ? "text-gray-400 dark:text-gray-600" : "text-brand-500"} 
      />
      <span className="whitespace-nowrap">
        {loading ? "Generating..." : buttonLabel}
      </span>
    </Button>
  );
}