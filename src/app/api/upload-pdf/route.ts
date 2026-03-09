import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawFilename = searchParams.get("filename") ?? "report.pdf";
    const cleanName = rawFilename.replace(/[^a-zA-Z0-9.]/g, "-");
    const useLocal = process.env.UPLOAD_PROVIDER === "local";

    let url = "";

    if (useLocal) {
      const buffer = Buffer.from(await req.arrayBuffer());
      const uploadDir = path.join(process.cwd(), "public/uploads/reports");
      if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, cleanName), buffer);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      url = `${baseUrl}/uploads/reports/${cleanName}`; 
    } else {
      const blob = await put(`reports/${cleanName}`, req.body!, {
        access: "public",
        contentType: "application/pdf",
        addRandomSuffix: true,
      });
      url = blob.url;
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("PDF Upload Error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}