"use client";

import React, { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { IoLogoWhatsapp } from "react-icons/io";

export interface SharePdfButtonProps {
  title: string;
  filename: string;
  data: Record<string, any>;
  buttonLabel?: string;
}

export default function SharePdfButton({
  title,
  filename,
  data,
  buttonLabel = "Share via WhatsApp",
}: SharePdfButtonProps) {
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

  const generateAndShare = async () => {
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
        headStyles: { fillColor: [0, 166, 184]}, // Blue header
      });

      // Prepare the PDF Blob
      const pdfOutput = doc.output("arraybuffer");
      const pdfBlob = new Blob([pdfOutput], { type: "application/pdf" });

      // -------- 3. UPLOAD TO VERCEL --------
      let vercelUrl = "";
      try {
        const uniqueFilename = `${filename}_${Date.now()}.pdf`;
        const response = await fetch(`/api/upload-pdf?filename=${uniqueFilename}`, {
          method: "POST",
          body: pdfBlob,
        });

        if (response.ok) {
          const result = await response.json();
          vercelUrl = result.url;
        }
      } catch (err) {
        console.error("Upload failed:", err);
      }

      // -------- 4. THE REDIRECT (WHATSAPP) --------
      const message = vercelUrl
        ? `📄 *${title}*\n\n✅ Click here to view report:\n${vercelUrl}`
        : `📄 *${title}*\n\nReport generated. Please attach the downloaded file.`;

      const whatsappLink = `https://wa.me/918921837945?text=${encodeURIComponent(message)}`;

      // Link Injection Trick
      const anchor = document.createElement("a");
      anchor.href = whatsappLink;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // -------- 5. LOCAL DOWNLOAD BACKUP --------
      const localUrl = URL.createObjectURL(pdfBlob);
      const dlLink = document.createElement("a");
      dlLink.href = localUrl;
      dlLink.download = `${filename}.pdf`;
      dlLink.click();
      URL.revokeObjectURL(localUrl);

    } catch (err) {
      console.error("Process failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={(e) => { e.stopPropagation(); generateAndShare(); }}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:border-white/10 dark:text-gray-300 disabled:opacity-60 active:scale-95 w-full sm:w-auto justify-center"
    >
      <IoLogoWhatsapp 
        size={18} 
        className={`${loading ? "text-[#25D366]" : "text-[#25D366]"}`} 
      />
      <span className="whitespace-nowrap">
        {loading ? "Processing..." : buttonLabel}
      </span>
    </button>
  );
}