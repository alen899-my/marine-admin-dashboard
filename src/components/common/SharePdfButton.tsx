"use client";

import React, { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { IoLogoWhatsapp } from "react-icons/io"; // Install react-icons if needed

interface SharePdfButtonProps {
  title: string;
  filename: string;
  data: Record<string, any>; // The object containing report details
}

export default function SharePdfButton({ title, filename, data }: SharePdfButtonProps) {
  const [loading, setLoading] = useState(false);

  const generateAndShare = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF();
      
      // Add Title
      doc.setFontSize(18);
      doc.text(title, 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

      // Transform data object into table rows
      const tableRows = Object.entries(data).map(([key, value]) => [
        key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'), 
        value?.toString() || "-"
      ]);

      autoTable(doc, {
        startY: 35,
        head: [["Field", "Value"]],
        body: tableRows,
        theme: "striped",
        headStyles: { fillColor: [41, 128, 185] },
      });

      const pdfBlob = doc.output("blob");
      const file = new File([pdfBlob], `${filename}.pdf`, { type: "application/pdf" });

      // 1. Try Web Share API (Works on Mobile/Modern Browsers)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title,
          text: `Please find the attached ${title}`,
        });
      } else {
        // 2. Fallback: Download and provide WhatsApp Web Link
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.pdf`;
        link.click();
        
        // Open WhatsApp Web
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent("I've downloaded the report: " + title)}`;
        window.open(whatsappUrl, "_blank");
        alert("PDF downloaded. You can now attach it to the WhatsApp window that opened.");
      }
    } catch (error) {
      console.error("Sharing failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={generateAndShare}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
    >
      <IoLogoWhatsapp className="text-base" />
      {loading ? "Generating..." : "Share to WhatsApp"}
    </button>
  );
}