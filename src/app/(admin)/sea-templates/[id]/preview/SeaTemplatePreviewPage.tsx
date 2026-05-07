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
      // Use the HTML that SeaDocumentPreview built after measurement (has correct
      // page-break layout). Fall back to our own build if not ready yet.
      const html = capturedHtmlRef.current ?? buildFallbackHtml();

      const res = await fetch("/api/generate-pdf/sea-template", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ html, filename: template.name || "SEA-Document" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Server PDF generation failed");
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${template.name || "SEA-Document"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error("PDF download failed:", err);
      alert(`PDF generation failed: ${err?.message || "Please try again."}`);
    } finally {
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