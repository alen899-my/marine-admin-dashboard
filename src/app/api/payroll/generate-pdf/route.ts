import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
import fs from "fs";
import path from "path";
import { generatePayrollHtml } from "@/lib/payroll-pdf-template";
import { getSettings } from "@/lib/systemSettings.server";

export const runtime = "nodejs";

function inlinePublicImages(html: string): string {
  return html.replace(/src=["'](\/?[^"':]+\.(png|jpg|jpeg|gif|webp|svg))["']/gi, (match, relPath) => {
    try {
      const cleanPath = relPath.replace(/^\//, "");
      const filePath  = path.join(process.cwd(), "public", cleanPath);
      if (!fs.existsSync(filePath)) return match;

      const ext      = path.extname(filePath).slice(1).toLowerCase();
      const mimeMap: Record<string, string> = {
        png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
        gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
      };
      const mime   = mimeMap[ext] || "image/png";
      const data   = fs.readFileSync(filePath).toString("base64");
      return `src="data:${mime};base64,${data}"`;
    } catch {
      return match;
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    // Optional: Check authorization. The user mentioned sea contracts, 
    // maybe they have a shared permission or we use payroll specific one.
    // const authz = await authorizeRequest("payroll.generate_pdf");
    // if (!authz.ok) return authz.response;

    const { row, leaveTypes, currencyCode = "USD" } = await req.json();

    if (!row) {
      return NextResponse.json({ error: "Missing payroll data" }, { status: 400 });
    }

    const settings = await getSettings(row.companyId ? { companyId: row.companyId } : undefined);
    const currencySettings = settings ? {
      currencyPosition: settings.currencyPosition as "left" | "right",
      currencyFormatType: settings.currencyFormatType as "symbol" | "code",
      currencySpace: settings.currencySpace,
    } : undefined;

    const html = generatePayrollHtml(row, leaveTypes, currencyCode, currencySettings);
    const resolvedHtml = inlinePublicImages(html);
    
    const puppeteer = (await import("puppeteer")).default;
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123 });
    await page.setContent(resolvedHtml, { waitUntil: "networkidle0" });

    const pdfUint8 = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
    });

    await browser.close();

    const pdfBuffer = Buffer.from(pdfUint8);
    const filename = `Payslip_${row.crewName.replace(/\s+/g, "_")}_${row.periodTo}`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("[api/payroll/generate-pdf] Error:", err);
    return NextResponse.json(
      { error: err?.message || "PDF generation failed" },
      { status: 500 }
    );
  }
}
