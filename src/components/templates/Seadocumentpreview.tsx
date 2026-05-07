"use client";

import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getMockPlaceholders } from "@/lib/seaPlaceholders";
import { Modal } from "@/components/ui/modal";

// ─────────────────────────────────────────────────────────────────
// LAYOUT CONSTANTS
// A4 = 794px wide | PAD_PX = 57px (15mm at 96dpi)
// FOOTER_H = reserved px at bottom of every page for footer
// ─────────────────────────────────────────────────────────────────
const A4_W_PX = 794;
const PAD_PX = 57;
const CONTENT_W = A4_W_PX - PAD_PX * 2;
const A4_H_PX = 1123; // full A4 height in px (297mm @ 96dpi)
const FOOTER_H = 80; // px reserved for footer (adjust if your footer is taller)
const HEADER_H = 182; // px consumed by header on first page
const TITLE_H = 0; // px consumed by heading/meta on first page
const GAP = 1;

// content budget per page (pixels available for blocks)
const FIRST_BUDGET = A4_H_PX - PAD_PX - HEADER_H - TITLE_H - FOOTER_H - PAD_PX;
const PAGE_BUDGET = A4_H_PX - PAD_PX - HEADER_H - FOOTER_H - PAD_PX;

// ─────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────
const MOCK_DATA = getMockPlaceholders();

function fillTokens(
  text: string,
  values: Record<string, string>,
  highlight = false,
): string {
  if (!text) return "";
  return text.replace(/\[([^\]]+)\]/g, (_, key) => {
    const k = key.trim().toUpperCase();
    const value = values[k];
    if (value !== undefined && value !== "") {
      return highlight
        ? `<span style="color:#000000;border-radius:2px;padding:0 1px;">${value}</span>`
        : value;
    }
    const mockValue = MOCK_DATA[k];
    const display = `[${k}]`;
    if (highlight) {
      return `<span style="color:#000000;border-radius:2px;padding:0 1px;">${display}</span>`;
    }
    return display;
  });
}

function hasValue(
  text: string,
  values: Record<string, string>,
  isTemplateMode = false,
): boolean {
  if (isTemplateMode) return true;
  if (!text) return false;
  
  // If text itself is a key (no brackets, but matches patterns like CANDIDATE.NAME)
  const trimmed = text.trim();
  const upperTrimmed = trimmed.toUpperCase();
  if (values[upperTrimmed] !== undefined) {
    const val = values[upperTrimmed];
    return val !== "" && val !== "undefined" && val !== "null" && val !== "NaN";
  }

  const matches = text.match(/\[([^\]]+)\]/g);
  if (!matches) {
    return trimmed !== "" && trimmed !== "undefined" && trimmed !== "null" && trimmed !== "NaN";
  }

  return matches.some((m) => {
    const k = m.replace(/[\[\]]/g, "").trim().toUpperCase();
    const val = values[k];
    return val !== undefined && val !== "" && val !== "undefined" && val !== "null" && val !== "NaN";
  });
}


// ─────────────────────────────────────────────────────────────────
// SHARED CSS
// ─────────────────────────────────────────────────────────────────
const DOCUMENT_CSS = `
  .sea-doc-scope, .sea-doc-scope * { box-sizing: border-box; }
  .sea-doc-scope a { color: inherit !important; text-decoration: none !important; }

  .sea-doc-scope .sea-richtext-content { overflow-x: hidden; }
 .sea-doc-scope .sea-richtext-content p span { line-height: 1.4 !important; }
  .sea-doc-scope .sea-richtext-content p:empty { min-height: 14pt; display: block; }
  .sea-doc-scope .sea-richtext-content p:empty::before { content: ""; display: block; }
  .sea-doc-scope .sea-richtext-content h1  { font-size:13pt; font-weight:bold; margin:5pt 0 2pt; }
  .sea-doc-scope .sea-richtext-content h2  { font-size:11pt; font-weight:bold; margin:4pt 0 2pt; }
  .sea-doc-scope .sea-richtext-content h3  { font-size:10pt; font-weight:bold; margin:3pt 0 1pt; }
  .sea-doc-scope .sea-richtext-content ul  { list-style:disc; padding-left:16pt; margin:2pt 0; }
  .sea-doc-scope .sea-richtext-content ol  { list-style:decimal; padding-left:16pt; margin:2pt 0; }
  .sea-doc-scope .sea-richtext-content li  { font-size:10pt; line-height:1.4; margin-bottom:1pt; }
  .sea-doc-scope .sea-richtext-content strong { font-weight:bold; }
  .sea-doc-scope .sea-richtext-content em     { font-style:italic; }
  .sea-doc-scope .sea-richtext-content u      { text-decoration:underline; }
  .sea-doc-scope .sea-richtext-content blockquote { border-left:2pt solid #999; padding-left:8pt; margin:3pt 0 3pt 4pt; color:#333; font-style:italic; }
  .sea-doc-scope .sea-richtext-content table  { width:100%; border-collapse:collapse; margin:3pt 0; table-layout:fixed; }
  .sea-doc-scope .sea-richtext-content table td,
  .sea-doc-scope .sea-richtext-content table th { border:1px solid #000; padding:3pt 5pt; font-size:9pt; vertical-align:top; word-break:break-word; }
  .sea-doc-scope .sea-richtext-content table th { background:#f0f0f0; font-weight:bold; text-align:left; }
  .sea-doc-scope .sea-richtext-content [style*="text-align: center"] { text-align:center !important; }
  .sea-doc-scope .sea-richtext-content [style*="text-align: right"]  { text-align:right !important; }
  .sea-doc-scope .sea-richtext-content [style*="text-align: justify"]{ text-align:justify !important; }

  /* Data tables — solid black */
  .sea-doc-scope .sea-data-table { width:100%; border-collapse:collapse; border:1px solid #000; table-layout:fixed; margin-bottom:6pt; }
  .sea-doc-scope .sea-data-table td { border:1px solid #000; padding:3pt 5pt; font-size:9pt; vertical-align:middle; word-break:break-word; }
  .sea-doc-scope .sea-data-table td.label { font-weight:bold; background:#fff; white-space:nowrap; }

  /* Wage table — solid black */
  .sea-doc-scope .sea-wage-table { width:100%; border-collapse:collapse; border:1px solid #000; table-layout:fixed; }
  .sea-doc-scope .sea-wage-table th { border:1px solid #000; padding:4pt 4pt; font-size:8.5pt; font-weight:bold; text-align:center; background:#fff; }
  .sea-doc-scope .sea-wage-table td { border:1px solid #000; padding:5pt 4pt; font-size:9pt; vertical-align:middle; }

  .sea-doc-scope .sea-info-box { border:1px solid #000; padding:4pt 6pt; margin-bottom:6pt; font-size:9.5pt; line-height:1.4; }

  /* Columns */
  .sea-doc-scope .sea-richtext-content [data-count] { display:grid !important; gap:2px !important; width:100% !important; margin-bottom:2pt !important; align-items:start !important; }
  .sea-doc-scope .sea-richtext-content [data-count="2"] { grid-template-columns:1fr 1fr !important; }
  .sea-doc-scope .sea-richtext-content [data-count="3"] { grid-template-columns:1fr 1fr 1fr !important; }
  .sea-doc-scope .sea-richtext-content [data-count] > * { min-width:0; overflow-wrap:break-word; word-break:break-word; }
  .sea-doc-scope .sea-richtext-content [data-count="2"] > * { text-align:justify !important; }
  .sea-doc-scope .sea-richtext-content [data-count="3"] > *:first-child { text-align:start !important; }
  .sea-doc-scope .sea-richtext-content [data-count="3"] > *:nth-child(2) { text-align:center !important; }
  .sea-doc-scope .sea-richtext-content [data-count="3"] > *:last-child { text-align:end !important; }

  /* Footer richtext */
  .sea-doc-scope .sea-footer-richtext p  { font-size:7.5pt !important; line-height:1.4 !important; margin:0 !important; }
  .sea-doc-scope .sea-footer-richtext h1,
  .sea-doc-scope .sea-footer-richtext h2,
  .sea-doc-scope .sea-footer-richtext h3 { font-size:8pt !important; margin:0 0 1pt !important; }
  .sea-doc-scope .sea-footer-richtext strong { font-weight:bold; }
  .sea-doc-scope .sea-footer-richtext em     { font-style:italic; }
  .sea-doc-scope .sea-footer-richtext [data-count] {
    display:grid !important; gap:1px !important; width:100% !important;
    margin-bottom:2pt !important; align-items:start !important;
  }
  .sea-doc-scope .sea-footer-richtext [data-count="2"] { grid-template-columns:1fr 1fr !important; }
  .sea-doc-scope .sea-footer-richtext [data-count="3"] { grid-template-columns:1fr 1fr 1fr !important; }
  .sea-doc-scope .sea-footer-richtext [data-count] > * { min-width:0; overflow-wrap:break-word; word-break:break-word; }
  .sea-doc-scope .sea-footer-richtext [style*="text-align: center"] { text-align:center !important; }
  .sea-doc-scope .sea-footer-richtext [style*="text-align: right"]  { text-align:right !important; }
  .sea-doc-scope .sea-footer-richtext [style*="text-align: justify"]{ text-align:justify !important; }

  @media print {
    .sea-doc-scope a { color:inherit !important; text-decoration:none !important; }
    .sea-doc-scope .sea-a4-page { page-break-after:always; break-after:page; box-shadow:none !important; }
    .sea-doc-scope .sea-a4-page:last-child { page-break-after:avoid; break-after:avoid; }
  }
`;

// ─────────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────────
function DocHeader({
  logoUrl,
  letterheadBgUrl,
  headerAddress,
  primaryColor,
  tokenValues,
}: {
  logoUrl?: string;
  letterheadBgUrl?: string;
  headerAddress?: string;
  primaryColor: string;
  tokenValues: Record<string, string>;
}) {
  const addrHtml = fillTokens(
    headerAddress ||
      (MOCK_DATA["COMPANY.ADDRESS"] || "").replace(/\n/g, "<br/>"),
    tokenValues,
  );

  return (
    <div
      style={{
        marginLeft: `-${PAD_PX}px`,
        marginRight: `-${PAD_PX}px`,
        marginTop: `-${PAD_PX}px`,
        marginBottom: "0",
      }}
    >
      <div
        style={{
          ...(letterheadBgUrl
            ? {
                backgroundImage: `url(${letterheadBgUrl})`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }
            : {}),
          position: "relative",
        }}
      >
        {letterheadBgUrl && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,255,255,0.68)",
              pointerEvents: "none",
            }}
          />
        )}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: `35px ${PAD_PX}px 12px ${PAD_PX}px`,
          }}
        >
          <div style={{ flexShrink: 0, maxWidth: "200px", marginTop: "35px" }}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                style={{
                  maxWidth: "100%",
                  maxHeight: "80px",
                  height: "auto",
                  display: "block",
                  objectFit: "contain",
                }}
              />
            ) : (
              <div
                style={{
                  width: "90px",
                  height: "90px",
                  background: primaryColor,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32pt",
                  fontWeight: "bold",
                  borderRadius: "6px",
                }}
              >
                M
              </div>
            )}
          </div>
          <div
            style={{
              textAlign: "right",
              fontSize: "9pt",
              lineHeight: 1.55,
              color: "#000",
              maxWidth: "50%",
            }}
          >
            <div className="sea-richtext-content" dangerouslySetInnerHTML={{ __html: addrHtml }} />
          </div>
        </div>
      </div>
      <div style={{ height: "2px", background: primaryColor, width: "100%" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// FOOTER — absolute, pinned to bottom of page, full-width bleed
// ─────────────────────────────────────────────────────────────────
function DocFooter({
  footerText,
  primaryColor,
  footerBgColor,
  footerTextColor,
}: {
  footerText?: string;
  primaryColor: string;
  footerBgColor?: string;
  footerTextColor?: string;
}) {
  if (!footerText) return null;

  const textColor = footerTextColor || "#000000";
  const bgColor = footerBgColor || "transparent";

  // Strip any inline color overrides so footerTextColor is respected
  const cleanFooterHtml = footerText.replace(
    /<(span|p|div|h[1-6]|td|th|a)([^>]*?)>/gi,
    (_match, tag, attrs) => {
      let style = "";
      if (attrs.includes("style=")) {
        const match = attrs.match(/style="([^"]*)"/);
        style = match ? match[1] : "";
      }
      const styleParts = style.split(";").filter(Boolean);
      const styleObj: Record<string, string> = {};
      styleParts.forEach((part) => {
        const idx = part.indexOf(":");
        if (idx > 0) {
          const key = part.substring(0, idx).trim();
          const val = part.substring(idx + 1).trim();
          styleObj[key] = val;
        }
      });
      if (!styleObj.color) styleObj.color = textColor;
      const newStyle = Object.entries(styleObj)
        .map(([key, val]) => `${key}:${val}`)
        .join(";");
      return `<${tag}${attrs.replace(/ style="[^"]*"/, "")} style="${newStyle}">`;
    },
  );

  return (
    // Absolute pin to bottom; negative left/right to cancel page padding = full bleed
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: `1px solid ${primaryColor}`,
        backgroundColor: bgColor,
        padding: `8px ${PAD_PX}px 10px`,
      }}
    >
      <div
        className="sea-footer-richtext"
        style={{ color: textColor, fontSize: "7.5pt", lineHeight: 1.4 }}
        dangerouslySetInnerHTML={{ __html: cleanFooterHtml }}
      />
    </div>
  );
}



// ─────────────────────────────────────────────────────────────────
// BLOCK TYPES
// ─────────────────────────────────────────────────────────────────
interface Block {
  sectionId: string;
  sectionTitle?: string;
  isFirstBlockOfSection: boolean;
  type: string;
  html?: string;
  section: any;
}

function sectionToBlocks(
  section: any,
  tokenValues: Record<string, string> = {},
  highlight = true,
  isTemplateMode = false,
): Block[] {
  const base = { sectionId: section.id, sectionTitle: section.title, section };

  if (["signature_block", "page_break"].includes(section.type)) {
    return [{ ...base, isFirstBlockOfSection: true, type: section.type }];
  }

  const originalContent = section.content || "";
  let processedRaw = originalContent;

  if (!isTemplateMode) {
    // We use a temporary div to parse the HTML before filling tokens, 
    // so we can identify and remove whole table rows that have empty placeholders.
    const tmp = document.createElement("div");
    tmp.innerHTML = originalContent;

    const tables = Array.from(tmp.querySelectorAll("table"));
    tables.forEach((table) => {
      const rows = Array.from(table.querySelectorAll("tr"));
      rows.forEach((tr) => {
        const rowHtml = tr.innerHTML;
        const matches = rowHtml.match(/\[([^\]]+)\]/g);
        if (matches && matches.length > 0) {
          // If row HAS placeholders, check if ALL are empty
          const allEmpty = matches.every((m) => !hasValue(m, tokenValues, isTemplateMode));
          if (allEmpty) {
            tr.remove();
          }
        }
      });
    });
    processedRaw = tmp.innerHTML;
  }
  const raw = fillTokens(processedRaw, tokenValues, highlight);

  if (!raw.trim())
    return [
      { ...base, isFirstBlockOfSection: true, type: "richtext", html: "" },
    ];

  // Re-parse the filled HTML to split into blocks (one per top-level tag)
  const finalTmp = document.createElement("div");
  finalTmp.innerHTML = raw;
  const kids = Array.from(finalTmp.children);

  if (!kids.length)
    return [
      { ...base, isFirstBlockOfSection: true, type: "richtext", html: raw },
    ];

  return kids.map((el, idx) => {
    const html = el.outerHTML;
    const isEmptyP =
      el.tagName === "P" && (el.innerHTML === "" || el.innerHTML === "<br>");
    return {
      ...base,
      isFirstBlockOfSection: idx === 0,
      type: "richtext",
      html: isEmptyP ? "<p>&nbsp;</p>" : html,
    };
  });
}

// ─────────────────────────────────────────────────────────────────
// BLOCK → JSX
// ─────────────────────────────────────────────────────────────────
function BlockJSX({
  block,
  tokenValues,
  companyName,
  isTemplateMode,
}: {
  block: Block;
  tokenValues: Record<string, string>;
  companyName: string;
  isTemplateMode?: boolean;
}) {
  if (block.type === "signature_block")
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "28pt",
          marginBottom: "16pt",
        }}
      >
        <div style={{ width: "45%" }}>
          <p style={{ fontSize: "9pt", margin: "0 0 24pt" }}>
            For {fillTokens(companyName || "[COMPANY.NAME]", tokenValues)}
          </p>
          <div
            style={{
              borderBottom: "1px solid #000",
              width: "100%",
              height: "28pt",
              marginBottom: "3pt",
            }}
          />
          <p style={{ fontSize: "8.5pt", fontWeight: "bold", margin: 0 }}>
            (Authorised Signatory)
          </p>
          <p style={{ fontSize: "8.5pt", margin: 0 }}>
            on behalf of Ship Owner:
          </p>
        </div>
        <div style={{ width: "45%", textAlign: "right" }}>
          <p style={{ fontSize: "9pt", margin: "0 0 24pt", opacity: 0 }}>.</p>
          <div
            style={{
              borderBottom: "1px solid #000",
              width: "100%",
              height: "28pt",
              marginBottom: "3pt",
            }}
          />
          <p style={{ fontSize: "8.5pt", fontWeight: "bold", margin: 0 }}>
            Signature of the Seafarer
          </p>
        </div>
      </div>
    );


  const isEmptyBlock =
    block.html === "<p>&nbsp;</p>" ||
    block.html === "<p></p>" ||
    block.html === "<p><br></p>";

  return (
    <div style={{ marginBottom: "1pt" }}>
      <div
        className="sea-richtext-content"
        style={{
          fontSize: "10pt",
          lineHeight: "1.4",
          textAlign: "justify",
          ...(isEmptyBlock ? { minHeight: "14pt" } : {}),
        }}
        dangerouslySetInnerHTML={{ __html: block.html || "" }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// A4 PAGE SHELL
// position:relative so footer can be absolute-pinned to bottom
// paddingBottom reserves space so content never overlaps footer
// ─────────────────────────────────────────────────────────────────
function A4Page({
  children,
  isFirst,
  logoUrl,
  letterheadBgUrl,
  headerAddress,
  footerText,
  primaryColor,
  tokenValues,
  mainHeading,
  subHeading,
  metaRow,
  footerBgColor,
  footerTextColor,
}: {
  children: React.ReactNode;
  isFirst: boolean;
  logoUrl?: string;
  letterheadBgUrl?: string;
  headerAddress?: string;
  footerText?: string;
  primaryColor: string;
  tokenValues: Record<string, string>;
  mainHeading?: string;
  subHeading?: string;
  metaRow?: React.ReactNode;
  footerBgColor?: string;
  footerTextColor?: string;
}) {
  return (
    <div
      className="sea-a4-page"
      style={{
        position: "relative", // ← anchor for absolute footer
        background: "#fff",
        width: `${A4_W_PX}px`,
        height: `${A4_H_PX}px`, // exact A4 height — no min-height
        maxWidth: "none",
        boxSizing: "border-box",
        padding: `${PAD_PX}px`,
        paddingBottom: `${FOOTER_H + PAD_PX}px`, // ← reserve room for footer
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Calibri', 'Segoe UI', Tahoma, sans-serif",
        fontWeight: 400,
        color: "#000",
        fontSize: "10pt",
        lineHeight: 1.4,
        overflow: "hidden", // keep content within page bounds
        boxShadow: "none",
      }}
    >
      <DocHeader
        logoUrl={logoUrl}
        letterheadBgUrl={letterheadBgUrl}
        headerAddress={headerAddress}
        primaryColor={primaryColor}
        tokenValues={tokenValues}
      />

      <div style={{ height: "0" }} />

      {isFirst && (
        <>
          {metaRow}
          <h1
            style={{
              textAlign: "center",
              textDecoration: "underline",
              fontSize: "12pt",
              fontWeight: "bold",
              margin: `6pt 0 ${subHeading ? "3pt" : "10pt"}`,
              textTransform: "uppercase",
            }}
          ></h1>
          {subHeading && (
            <p
              style={{
                textAlign: "center",
                fontSize: "10pt",
                margin: "0 0 6pt",
                fontStyle: "italic",
              }}
            >
              {subHeading}
            </p>
          )}
        </>
      )}

      {/* Content area — grows to fill space above footer */}
      <div style={{ flex: 1, overflow: "hidden" }}>{children}</div>

      {/* Footer is absolute so it never pushes content and always sits at bottom */}
      <DocFooter
        footerText={footerText}
        primaryColor={primaryColor}
        footerBgColor={footerBgColor}
        footerTextColor={footerTextColor}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PRINT HTML BUILDER  (used for the separate print window / html2pdf)
// ─────────────────────────────────────────────────────────────────
export function buildPrintHtml(params: {
  pages: Block[][];
  allBlocks: Block[];
  tokenValues: Record<string, string>;
  companyName: string;
  logoUrl?: string;
  letterheadBgUrl?: string;
  headerAddress?: string;
  footerText?: string;
  primaryColor: string;
  mainHeading?: string;
  subHeading?: string;
  footerBgColor?: string;
  footerTextColor?: string;
}): string {
  const {
    pages,
    allBlocks,
    tokenValues,
    companyName,
    logoUrl,
    letterheadBgUrl,
    headerAddress,
    footerText,
    primaryColor,
    mainHeading,
    subHeading,
    footerBgColor,
    footerTextColor,
  } = params;

  const printPages = pages.length > 0 ? pages : [allBlocks];
  const ftColor = footerTextColor || "#000000";
  const ftBg = footerBgColor || "transparent";

  const addrHtml = fillTokens(
    headerAddress ||
      (MOCK_DATA["COMPANY.ADDRESS"] || "").replace(/\n/g, "<br/>"),
    tokenValues,
  );

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" style="max-width:200px;max-height:80px;height:auto;display:block;object-fit:contain;margin-top:35px;" />`
    : `<div style="width:60px;height:60px;background:${primaryColor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:24pt;font-weight:bold;border-radius:6px;">M</div>`;

  const bgStyle = letterheadBgUrl
    ? `background-image:url('${letterheadBgUrl}');background-size:100% 100%;background-repeat:no-repeat;`
    : "";
  const overlay = letterheadBgUrl
    ? `<div style="position:absolute;inset:0;background:rgba(255,255,255,0.68);pointer-events:none;"></div>`
    : "";

  // Header block (margins push it edge-to-edge within the 57px padded page)
  const headerHtml = `
    <div style="margin:-57px -57px 0;${bgStyle}position:relative;">
      ${overlay}
      <div style="position:relative;z-index:1;display:flex;justify-content:space-between;align-items:flex-start;padding:35px 57px 12px 57px;">
        <div style="flex-shrink:0;max-width:200px;">${logoHtml}</div>
        <div style="text-align:right;font-size:9pt;line-height:1.55;color:#000;max-width:50%;">
          <div class="sea-richtext-content">${addrHtml}</div>
        </div>
      </div>
    </div>
    <div style="margin:0 -57px;height:2px;background:${primaryColor};"></div>
    <div style="height:0;"></div>`;

  // Footer: absolute, pinned to bottom, full-width via negative margins
  const cleanFooterForPrint = (html: string, color: string) => {
    let result = html;
    result = result.replace(
      /<(span|p|div|h[1-6]|td|th|a)([^>]*?)>/gi,
      (_m, tag, attrs) => {
        let style = "";
        if (attrs.includes("style=")) {
          const match = attrs.match(/style="([^"]*)"/);
          style = match ? match[1] : "";
        }
        const styleParts = style.split(";").filter(Boolean);
        const styleObj: Record<string, string> = {};
        styleParts.forEach((part) => {
          const idx = part.indexOf(":");
          if (idx > 0) {
            const key = part.substring(0, idx).trim();
            const val = part.substring(idx + 1).trim();
            styleObj[key] = val;
          }
        });
        if (!styleObj.color) styleObj.color = color;
        const newStyle = Object.entries(styleObj)
          .map(([key, val]) => `${key}:${val}`)
          .join(";");
        return `<${tag}${attrs.replace(/ style="[^"]*"/, "")} style="${newStyle}">`;
      },
    );
    return result;
  };

  const footerHtml = footerText
    ? `
    <div style="
      position:absolute;
      bottom:0;left:0;right:0;
      border-top:1px solid ${primaryColor};
      background-color:${ftBg};
      padding:8px 57px 10px;
    ">
      <div style="color:${ftColor};font-size:7.5pt;line-height:1.4;">
        ${cleanFooterForPrint(footerText, ftColor)}
      </div>
    </div>`
    : "";

  const titleHtml = `
    <h1 style="text-align:center;text-decoration:underline;font-size:12pt;font-weight:bold;margin:6pt 0 ${subHeading ? "3pt" : "10pt"};text-transform:uppercase;font-family:'Calibri','Segoe UI',Tahoma,sans-serif;">
      
    </h1>
    ${subHeading ? `<p style="text-align:center;font-size:10pt;margin:0 0 6pt;font-style:italic;">${subHeading}</p>` : ""}`;

  const blockToHtml = (block: Block): string => {

    if (block.type === "signature_block")
      return `
      <div style="display:flex;justify-content:space-between;margin-top:28pt;margin-bottom:16pt;">
        <div style="width:45%;">
          <p style="font-size:9pt;margin:0 0 24pt;">For ${fillTokens(companyName || "[COMPANY.NAME]", tokenValues)}</p>
          <div style="border-bottom:1px solid #000;height:28pt;margin-bottom:3pt;"></div>
          <p style="font-size:8.5pt;font-weight:bold;margin:0;">(Authorised Signatory)</p>
          <p style="font-size:8.5pt;margin:0;">on behalf of Ship Owner:</p>
        </div>
        <div style="width:45%;text-align:right;">
          <p style="font-size:9pt;margin:0 0 24pt;opacity:0;">.</p>
          <div style="border-bottom:1px solid #000;height:28pt;margin-bottom:3pt;"></div>
          <p style="font-size:8.5pt;font-weight:bold;margin:0;">Signature of the Seafarer</p>
        </div>
      </div>`;

    // Richtext — ensure table borders are solid black
    const richtextHtml = (block.html || "")
      .replace(/<td([^>]*)>/gi, (_m, attrs) => {
        const s = attrs.includes("style=")
          ? attrs.replace(
              /style="([^"]*)"/,
              (_: string, prev: string) =>
                `style="${prev};border:1px solid #000;"`,
            )
          : `${attrs} style="border:1px solid #000;"`;
        return `<td${s}>`;
      })
      .replace(/<th([^>]*)>/gi, (_m, attrs) => {
        const s = attrs.includes("style=")
          ? attrs.replace(
              /style="([^"]*)"/,
              (_: string, prev: string) =>
                `style="${prev};border:1px solid #000;"`,
            )
          : `${attrs} style="border:1px solid #000;"`;
        return `<th${s}>`;
      });
    // FIXED — add sea-richtext-content class
    return `<div style="margin-bottom:1pt;"><div class="sea-richtext-content" style="font-size:10pt;line-height:1.4;text-align:justify;">${richtextHtml}</div></div>`;
  };

  // Each page: exact A4 height, position:relative for absolute footer
  const pagesHtml = printPages
    .map((pageBlocks, idx) => {
      const body = pageBlocks
  .filter(Boolean)
  .map(b => `<div style="margin-bottom:${GAP}px">${blockToHtml(b)}</div>`)
  .join("");
      return `
      <div style="
        position:relative;
        width:794px;
        height:1123px;
        padding:57px 57px 137px;
        box-sizing:border-box;
        page-break-after:always;
        break-after:page;
        font-size:10pt;
        line-height:1.4;
        color:#000;
        background:#fff;
        overflow:hidden;
      ">
        ${headerHtml}
        ${idx === 0 ? titleHtml : ""}
        <div style="overflow:hidden;">${body}</div>
        ${footerHtml}
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Seafarer Employment Agreement</title>
  <style>
    @page { size: A4; margin: 0; }
    *, *::before, *::after { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
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
    [data-count] { display:grid !important; gap:1px !important; width:100% !important; margin-bottom:1pt !important; align-items:start !important; }
    [data-count="2"] { grid-template-columns:1fr 1fr !important; }
    [data-count="3"] { grid-template-columns:1fr 1fr 1fr !important; }
    [data-count] > * { min-width:0; overflow-wrap:break-word; word-break:break-word; }

    .sea-doc-scope, .sea-doc-scope * { box-sizing: border-box; }
    .sea-richtext-content { overflow-x: hidden; }
    .sea-richtext-content p span { line-height: 1.4 !important; }

    .sea-richtext-content p:empty { min-height: 14pt; display: block; }
    .sea-richtext-content p:empty::before { content: ""; display: block; }
    .sea-richtext-content h1  { font-size:13pt; font-weight:bold; margin:5pt 0 2pt; }
    .sea-richtext-content h2  { font-size:11pt; font-weight:bold; margin:4pt 0 2pt; }
    .sea-richtext-content h3  { font-size:10pt; font-weight:bold; margin:3pt 0 1pt; }
    .sea-richtext-content ul  { list-style:disc; padding-left:16pt; margin:2pt 0; }
    .sea-richtext-content ol  { list-style:decimal; padding-left:16pt; margin:2pt 0; }
    .sea-richtext-content li  { font-size:10pt; line-height:1.4; margin-bottom:1pt; }
    .sea-richtext-content strong { font-weight:bold; }
    .sea-richtext-content em     { font-style:italic; }
    .sea-richtext-content u      { text-decoration:underline; }
    .sea-richtext-content blockquote { border-left:2pt solid #999; padding-left:8pt; margin:3pt 0 3pt 4pt; color:#333; font-style:italic; }
    .sea-richtext-content table  { width:100%; border-collapse:collapse; margin:3pt 0; table-layout:fixed; }
    .sea-richtext-content table td,
    .sea-richtext-content table th { border:1px solid #000; padding:3pt 5pt; font-size:9pt; vertical-align:top; word-break:break-word; }
    .sea-richtext-content table th { background:#f0f0f0; font-weight:bold; text-align:left; }
    .sea-richtext-content [style*="text-align: center"] { text-align:center !important; }
    .sea-richtext-content [style*="text-align: right"]  { text-align:right !important; }
    .sea-richtext-content [style*="text-align: justify"]{ text-align:justify !important; }
    .sea-richtext-content     [data-count] { display:grid !important; gap:1px !important; width:100% !important; margin-bottom:1pt !important; align-items:start !important; }
    .sea-richtext-content [data-count="2"] { grid-template-columns:1fr 1fr !important; }
    .sea-richtext-content [data-count="3"] { grid-template-columns:1fr 1fr 1fr !important; }
    .sea-richtext-content [data-count] > * { min-width:0; overflow-wrap:break-word; word-break:break-word; }
    .sea-richtext-content [data-count="2"] > * { text-align:justify !important; }
    .sea-richtext-content [data-count="3"] > *:first-child { text-align:start !important; }
    .sea-richtext-content [data-count="3"] > *:nth-child(2) { text-align:center !important; }
    .sea-richtext-content [data-count="3"] > *:last-child { text-align:end !important; }
.sea-richtext-content [data-count="3"] > *:last-child p,
.sea-richtext-content [data-count="3"] > *:last-child div { text-align:end !important; }

    .sea-footer-richtext p  { font-size:7.5pt !important; line-height:1.4 !important; margin:0 !important; }
    .sea-footer-richtext h1,.sea-footer-richtext h2,.sea-footer-richtext h3 { font-size:8pt !important; margin:0 0 1pt !important; }
    .sea-footer-richtext strong { font-weight:bold; }
    .sea-footer-richtext em { font-style:italic; }
    .sea-footer-richtext [data-count] { display:grid !important; gap:8px !important; width:100% !important; margin-bottom:2pt !important; align-items:start !important; }
    .sea-footer-richtext [data-count="2"] { grid-template-columns:1fr 1fr !important; }
    .sea-footer-richtext [data-count="3"] { grid-template-columns:1fr 1fr 1fr !important; }
    .sea-footer-richtext [data-count] > * { min-width:0; overflow-wrap:break-word; word-break:break-word; }
    .sea-footer-richtext [style*="text-align: center"] { text-align:center !important; }
    .sea-footer-richtext [style*="text-align: right"]  { text-align:right !important; }
    .sea-footer-richtext [style*="text-align: justify"]{ text-align:justify !important; }
  </style>
</head>
<body>${pagesHtml}</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function SeaDocumentPreview({
  sections,
  logoUrl,
  letterheadBgUrl,
  headerAddress,
  footerText,
  primaryColor = "#000000",
  companyName = "",
  mainHeading,
  subHeading,
  modal = false,
  onClose,
  tokenValues = {},
  isMini = false,
  footerBgColor,
  footerTextColor,
  isTemplateMode = false,
  exportTrigger,
  onHtmlReady,
}: any) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<Block[][]>([]);
  const [measured, setMeasured] = useState(false);
  const [allBlocks, setAllBlocks] = useState<Block[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const sorted = [...sections]
    .sort((a: any, b: any) => a.order - b.order)
    .filter((s: any) => s.enabled);

  const isPrinting =
    typeof window !== "undefined" && window.location.search.includes("print");
  const highlight = !isPrinting;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const blocks = sorted.flatMap((s: any) =>
      sectionToBlocks(s, tokenValues, highlight, isTemplateMode),
    );
    setAllBlocks(blocks);
    setMeasured(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(sections),
    JSON.stringify(tokenValues),
    isMini,
    isMounted,
  ]);

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=900,height=900");
    if (!w) {
      alert("Please allow popups for this site to export PDF.");
      return;
    }
    const html = buildPrintHtml({
      pages,
      allBlocks,
      tokenValues,
      companyName,
      logoUrl,
      letterheadBgUrl,
      headerAddress,
      footerText,
      primaryColor,
      mainHeading,
      subHeading,
      footerBgColor,
      footerTextColor,
    });
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 900);
  };

  useEffect(() => {
    if (!allBlocks.length) return;
    if (isMini) {
      setPages([allBlocks]);
      setMeasured(true);
      return;
    }

    const container = measureRef.current;
    if (!container) return;

    const frame = requestAnimationFrame(() => {
      const els = Array.from(container.children) as HTMLElement[];
      if (!els.length) {
        setPages([allBlocks]);
        setMeasured(true);
        return;
      }

      const sectionHeights: Record<string, number> = {};
      allBlocks.forEach((block, idx) => {
        if (!block) return;
        if (block.isFirstBlockOfSection) {
          let sectionHeight = 0;
          for (
            let i = idx;
            i < allBlocks.length && allBlocks[i]?.sectionId === block.sectionId;
            i++
          ) {
            sectionHeight +=
              (els[i]?.getBoundingClientRect().height || 0) + GAP;
          }
          sectionHeights[block.sectionId] = sectionHeight;
        }
      });

      const result: Block[][] = [];
      let curPage: Block[] = [];
      let usedPx = 0;
      let budget = FIRST_BUDGET;
      let processedSections = new Set<string>();

      els.forEach((el, idx) => {
        const block = allBlocks[idx];
        if (!block) return;
        const h = el.getBoundingClientRect().height + GAP;

        if (
          block.isFirstBlockOfSection &&
          !processedSections.has(block.sectionId)
        ) {
          processedSections.add(block.sectionId);
          const sectionH = sectionHeights[block.sectionId] || h;

          if (curPage.length > 0 && usedPx + sectionH > budget) {
            result.push(curPage);
            curPage = [];
            usedPx = 0;
            budget = PAGE_BUDGET;
          }
        }

        if (curPage.length > 0 && usedPx + h > budget) {
          result.push(curPage);
          curPage = [block];
          usedPx = h;
          budget = PAGE_BUDGET;
        } else {
          curPage.push(block);
          usedPx += h;
        }
      });
      if (curPage.length > 0 || !result.length) result.push(curPage);

      setPages(result);
      setMeasured(true);

      // Fire with fresh `result` — not stale `pages` state
      if (exportTrigger) exportTrigger(handlePrint);
      if (onHtmlReady) {
        const html = buildPrintHtml({
          pages: result,
          allBlocks,
          tokenValues,
          companyName,
          logoUrl,
          letterheadBgUrl,
          headerAddress,
          footerText,
          primaryColor,
          mainHeading,
          subHeading,
          footerBgColor,
          footerTextColor,
        });
        onHtmlReady(html);
      }
    });

    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allBlocks, isMini]);

  const metaRow = null;

  const sharedProps = {
    logoUrl,
    letterheadBgUrl,
    headerAddress,
    footerText,
    primaryColor,
    tokenValues,
    mainHeading,
    subHeading,
    footerBgColor,
    footerTextColor,
  };

  const measureContainer =
    isMounted && !isMini && allBlocks.length > 0
      ? createPortal(
          <div
            ref={measureRef}
            className="sea-doc-scope"
            style={{
              position: "fixed",
              top: "-99999px",
              left: "-99999px",
              width: `${CONTENT_W}px`,
              visibility: "hidden",
              fontFamily: "'Calibri', 'Segoe UI', Tahoma, sans-serif",
              fontSize: "10pt",
              lineHeight: 1.4,
              color: "#000",
              pointerEvents: "none",
            }}
          >
            <style>{DOCUMENT_CSS}</style>
            {allBlocks.filter(Boolean).map((block, i) => (
              <div key={`m_${block.sectionId}_${i}`}>
                <BlockJSX
                  block={block}
                  tokenValues={tokenValues}
                  companyName={companyName}
                  isTemplateMode={isTemplateMode}
                />
              </div>
            ))}
          </div>,
          document.body,
        )
      : null;

  const finalPages: Block[][] = measured
    ? pages.map((p) => p.filter(Boolean))
    : allBlocks.length > 0
      ? [allBlocks]
      : [];

  const outerStyle: React.CSSProperties = isMini
    ? { width: "100%", background: "#fff" }
    : {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
        padding: "0 0 20px 0",
        background: "transparent",
        minHeight: "100%",
        minWidth: `${A4_W_PX}px`,
        boxSizing: "border-box",
      };

  const allContent = (
    <div id="sea-pages-root" className="sea-doc-scope">
      <style>{DOCUMENT_CSS}</style>
      {measureContainer}
      <div className="sea-pages-outer" style={outerStyle}>
        {finalPages.length === 0 && !isMini && (
          <div
            style={{
              background: "#fff",
              width: `${A4_W_PX}px`,
              minHeight: "400px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "sans-serif",
              color: "#888",
              fontSize: "14px",
            }}
          >
            Preparing document…
          </div>
        )}
        {finalPages.map((pageBlocks, pageIdx) => (
          <A4Page
            key={pageIdx}
            {...sharedProps}
            isFirst={pageIdx === 0}
            metaRow={pageIdx === 0 ? metaRow : undefined}
          >
            {pageBlocks.map((block, bi) => (
              <div
                key={`${block.sectionId}_${bi}`}
                style={{ marginBottom: `${GAP}px` }}
              >
                <BlockJSX
                  block={block}
                  tokenValues={tokenValues}
                  companyName={companyName}
                />
              </div>
            ))}
          </A4Page>
        ))}
      </div>
    </div>
  );

  if (isMini) {
    return (
      <div
        style={{
          background: "#fff",
          width: "100%",
          fontFamily: "'Calibri', 'Segoe UI', Tahoma, sans-serif",
          color: "#000",
        }}
      >
        {allContent}
      </div>
    );
  }

  if (!modal) {
    return (
      <div
        style={{
          background: "transparent",
          minHeight: "100%",
          width: "100%",
          overflowX: "auto",
          fontFamily: "'Calibri', 'Segoe UI', Tahoma, sans-serif",
        }}
      >
        {allContent}
      </div>
    );
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      className="max-w-6xl w-full max-h-[98vh] p-0"
      showCloseButton={false}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-6xl max-h-[98vh] flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-8 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0 gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">
              Document Preview
            </h2>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
              A4 · {finalPages.length} page{finalPages.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 text-xs sm:text-sm"
            >
              Export PDF
            </button>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all active:scale-90"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <div
          className="flex-1 overflow-y-auto overflow-x-auto scroll-smooth"
          style={{ background: "#9e9e9e" }}
        >
          {allContent}
        </div>
      </div>
    </Modal>
  );
}
