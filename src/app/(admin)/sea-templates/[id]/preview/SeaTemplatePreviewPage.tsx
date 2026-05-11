"use client";
// src/app/(admin)/sea-templates/[id]/preview/SeaTemplatePreviewPage.tsx
//
// Two bugs fixed vs v1:
//  1. LOGO: route.ts now inlines /public images as base64 — no change needed here.
//  2. PAGES: we capture the already-measured pages[] from SeaDocumentPreview via
//     exportTrigger and send them to buildPrintHtml so multi-page layout is exact.

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import SeaDocumentPreview, { buildPrintHtml } from "@/components/templates/Seadocumentpreview";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useAuthorization } from "@/hooks/useAuthorization";
import Button from "@/components/ui/button/Button";
import { Pencil, Download, Loader2 } from "lucide-react";

interface Props {
  template: any;
}

export default function SeaTemplatePreviewPage({ template }: Props) {
  const router = useRouter();
  const { can, isReady } = useAuthorization();
  const [downloading, setDownloading] = useState(false);

  // ── Capture the measured state from SeaDocumentPreview ──────────────────
  // SeaDocumentPreview calls exportTrigger(handlePrint) after DOM measurement.
  // We intercept that and instead store pages + allBlocks so we can pass them
  // to buildPrintHtml ourselves — giving us the exact same page-break layout.
  const capturedHtmlRef = useRef<string | null>(null);

  // exportTrigger receives the internal handlePrint fn from SeaDocumentPreview.
  // We immediately call it in a "dry run" mode — but actually we've overridden
  // the approach: instead of using the fn, we ask the component to call
  // buildPrintHtml and hand us the result via a shared ref.
  //
  // Simpler approach: we expose a `onHtmlReady` prop to SeaDocumentPreview
  // so it passes us the built HTML string after measurement.
  // See the small addition to Seadocumentpreview.tsx below.
  const onHtmlReady = useCallback((html: string) => {
    capturedHtmlRef.current = html;
  }, []);

  if (!isReady) return null;

  if (!can("templates.view")) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">
          You do not have permission to view SEA Templates.
        </p>
      </div>
    );
  }

  const canEdit = can("templates.edit");

  const sections = (template.sections || []).map((s: any) => ({
    id:      s._id?.toString() || String(s.order),
    key:     s._id?.toString() || String(s.order),
    title:   s.title   || "",
    label:   s.title   || "",
    type:    s.type    || "richtext",
    content: s.content || "",
    enabled: s.enabled !== false,
    order:   s.order   ?? 0,
    columns: s.columns || [],
  }));

  const tokenValues: Record<string, string> = {};

  // Helper to convert relative URL to full URL
  const getFullUrl = (path?: string) => {
    if (!path) return undefined;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${typeof window !== "undefined" ? window.location.origin : ""}${path}`;
  };

  const logoFullUrl     = getFullUrl(template.logoUrl);
  const letterheadFullUrl = getFullUrl(template.letterheadBgUrl);
  // This mirrors sectionToBlocks() but without highlight mode.
  // We do it here so we always have a fallback even if onHtmlReady hasn't fired.
  const buildFallbackHtml = (): string => {
    const SPECIAL_TYPES = new Set([
      "seafarer_table", "vessel_table", "wage_table",
      "disability_table", "signature_block", "manning_agent", "owner_manager",
    ]);
    const sortedSections = [...sections]
      .sort((a, b) => a.order - b.order)
      .filter((s) => s.enabled);

    const allBlocks: any[] = sortedSections.flatMap((s) => {
      if (SPECIAL_TYPES.has(s.type)) {
        return [{ sectionId: s.id, sectionTitle: s.title, isFirstBlockOfSection: true, type: s.type, section: s }];
      }
      return [{
        sectionId: s.id, sectionTitle: s.title,
        isFirstBlockOfSection: true, type: "richtext",
        html: s.content || "", section: s,
      }];
    });

    return buildPrintHtml({
      pages: [], allBlocks, tokenValues,
      companyName:     template.company?.name      || "",
      logoUrl:         logoFullUrl,
      letterheadBgUrl: letterheadFullUrl,
      headerAddress:   template.headerAddress,
      footerText:      template.footerText,
      primaryColor:    template.primaryColor        || "#1e40af",
      
      footerBgColor:   template.footerBgColor,
      footerTextColor: template.footerTextColor     || "#000000",
    });
  };

// ── Download handler ─────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const html = capturedHtmlRef.current ?? buildFallbackHtml();

      const printWindow = window.open("", "_blank");
      if (!printWindow) throw new Error("Failed to open print window");

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${template.name || "SEA Document"}</title>
          <style>
            @page { size: A4; margin: 0; }
            @media print {
              @page { size: A4; margin: 0; }
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
            *, *::before, *::after { box-sizing: border-box; }
            html, body { margin: 0; padding: 0; background: #fff; font-family: 'Calibri', 'Segoe UI', Tahoma, sans-serif; font-size: 10pt; color: #000; }
            a { color: inherit !important; text-decoration: none !important; }
            img { max-width: 100%; }
            p { margin: 0 0 2pt; }
            table { border-collapse: collapse; width: 100%; table-layout: fixed; }
            td, th { vertical-align: top; word-break: break-word; border: 1px solid #000; padding: 3pt 5pt; font-size: 9pt; }
            th { font-weight: bold; background: #fff; text-align: left; }
            h1, h2, h3 { font-family: 'Calibri', 'Segoe UI', Tahoma, sans-serif; font-size: inherit; font-weight: bold; margin: 0; padding: 0; }
            .sea-richtext-content h1 { font-size: 13pt !important; margin: 5pt 0 2pt !important; }
            .sea-richtext-content h2 { font-size: 11pt !important; margin: 4pt 0 2pt !important; }
            .sea-richtext-content h3 { font-size: 10pt !important; margin: 3pt 0 1pt !important; }
            ul { list-style: disc; padding-left: 16pt; margin: 2pt 0; }
            ol { list-style: decimal; padding-left: 16pt; margin: 2pt 0; }
            li { font-size: 10pt; line-height: 1.4; margin-bottom: 1pt; }
            blockquote { border-left: 2pt solid #999; padding-left: 8pt; margin: 3pt 0 3pt 4pt; color: #333; font-style: italic; }
            strong { font-weight: bold; } em { font-style: italic; } u { text-decoration: underline; }
            [data-count] { display: grid !important; gap: 1px !important; width: 100% !important; margin-bottom: 1pt !important; align-items: start !important; }
            [data-count="2"] { grid-template-columns: 1fr 1fr !important; }
            [data-count="3"] { grid-template-columns: 1fr 1fr 1fr !important; }
            [data-count] > * { min-width: 0; overflow-wrap: break-word; word-break: break-word; }
            .sea-doc-scope, .sea-doc-scope * { box-sizing: border-box; }
            .sea-richtext-content { overflow-x: hidden; }
            .sea-richtext-content p span { line-height: 1.4 !important; }
            .sea-richtext-content p:empty { min-height: 14pt; display: block; }
            .sea-richtext-content p:empty::before { content: ""; display: block; }
            .sea-richtext-content h1 { font-size: 13pt; font-weight: bold; margin: 5pt 0 2pt; }
            .sea-richtext-content h2 { font-size: 11pt; font-weight: bold; margin: 4pt 0 2pt; }
            .sea-richtext-content h3 { font-size: 10pt; font-weight: bold; margin: 3pt 0 1pt; }
            .sea-richtext-content ul { list-style: disc; padding-left: 16pt; margin: 2pt 0; }
            .sea-richtext-content ol { list-style: decimal; padding-left: 16pt; margin: 2pt 0; }
            .sea-richtext-content li { font-size: 10pt; line-height: 1.4; margin-bottom: 1pt; }
            .sea-doc-page {
              width: 794px;
              height: 1123px;
              padding: 57px 57px 137px;
              box-sizing: border-box;
              page-break-after: always;
              break-after: page;
              position: relative;
              overflow: hidden;
              background: #fff;
            }
            .sea-doc-page:last-child { page-break-after: auto; }
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
          setDownloading(false);
        }, 500);
      };

    } catch (err: any) {
      console.error("PDF download failed:", err);
      alert(`PDF generation failed: ${err?.message || "Please try again."}`);
      setDownloading(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb
        pageTitle={`Preview: ${template.name}`}
        items={[{ label: "SEA Templates", href: "/sea-templates" }]}
      />

      <div className="flex items-center justify-end gap-3 mb-4">
        <Button
          variant="primary"
          size="sm"
          startIcon={downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          onClick={handleDownloadPDF}
          disabled={downloading}
        >
          {downloading ? "Generating..." : "Download PDF"}
        </Button>

        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            startIcon={<Pencil className="w-4 h-4" />}
            onClick={() => router.push(`/sea-templates/${template._id}/edit`)}
          >
            Edit Template
          </Button>
        )}
      </div>

      <div className="w-full overflow-x-auto custom-scrollbar">
        <SeaDocumentPreview
          sections={sections}
          logoUrl={logoFullUrl}
          letterheadBgUrl={letterheadFullUrl}
          headerAddress={template.headerAddress}
          footerText={template.footerText}
          footerBgColor={template.footerBgColor}
          footerTextColor={template.footerTextColor || "#000000"}
          primaryColor={template.primaryColor || "#1e40af"}
          companyName={template.company?.name}
          tokenValues={tokenValues}
          modal={false}
          showBrackets={false}
          isTemplateMode={true}
          onHtmlReady={onHtmlReady}
        />
      </div>
    </div>
  );
}