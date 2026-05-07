// src/app/api/generate-pdf/sea-template/route.ts
//
// SETUP — run once in your project root:
//   npm install puppeteer
//
// Two bugs fixed vs v1:
//  1. LOGO: relative /images/... URLs are resolved from the public folder
//     and inlined as base64 data: URIs so Puppeteer can render them.
//  2. PAGES: the client now sends the already-measured `pages` array (from
//     SeaDocumentPreview's DOM measurement), so multi-page layout is preserved
//     exactly as shown in the preview.

import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest"; // ✅ Added Auth check
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

// ── Resolve any src="..." attributes that are relative paths (/images/...) ──
// Puppeteer runs headlessly with no web server context, so relative URLs 404.
// We read the file from the Next.js `public` folder and replace with base64.
function inlinePublicImages(html: string): string {
  // Match src="..." or src='...' where the value starts with / (relative)
  return html.replace(/src=["'](\/?[^"':]+\.(png|jpg|jpeg|gif|webp|svg))["']/gi, (match, relPath) => {
    try {
      // Strip leading slash to get path relative to public/
      const cleanPath = relPath.replace(/^\//, "");
      const filePath  = path.join(process.cwd(), "public", cleanPath);
      if (!fs.existsSync(filePath)) return match; // leave as-is if file missing

      const ext      = path.extname(filePath).slice(1).toLowerCase();
      const mimeMap: Record<string, string> = {
        png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
        gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
      };
      const mime   = mimeMap[ext] || "image/png";
      const data   = fs.readFileSync(filePath).toString("base64");
      return `src="data:${mime};base64,${data}"`;
    } catch {
      return match; // if anything fails, leave the original src
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const authz = await authorizeRequest("sea.document.generate");
    if (!authz.ok) return authz.response;

    const { html, filename = "SEA-Document" } = await req.json() as {
      html: string;
      filename?: string;
    };

    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "Missing html payload" }, { status: 400 });
    }

    // Inline all relative /public images as base64 so Puppeteer renders them
    const resolvedHtml = inlinePublicImages(html);
    
    const puppeteer = (await import("puppeteer")).default;

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    });

    // setContent with networkidle0 — all data: URIs are instant, no network needed
    await page.setContent(resolvedHtml, { waitUntil: "networkidle0" });

    // A4 at 96dpi: 794px × 1123px
    const pdfUint8 = await page.pdf({
      width: "794px",
      height: "1123px",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await browser.close();

    // Convert Uint8Array → Buffer so NextResponse accepts it as BodyInit
    const pdfBuffer = Buffer.from(pdfUint8);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Content-Length":      pdfBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("[generate-pdf/sea-template] Error:", err);
    return NextResponse.json(
      { error: err?.message || "PDF generation failed" },
      { status: 500 }
    );
  }
}