import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawFilename = searchParams.get("filename") ?? "report.pdf";
    
    // Clean filename: Remove timestamps for the URL, but keep it unique in storage
    const cleanName = `reports/${rawFilename.replace(/[^a-zA-Z0-9.]/g, "-")}`;

    const blob = await put(cleanName, req.body!, {
      access: "public",
      contentType: "application/pdf",
      addRandomSuffix: true, // Vercel adds a short ID to prevent overwriting but keeps name clean
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("PDF Upload Error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}