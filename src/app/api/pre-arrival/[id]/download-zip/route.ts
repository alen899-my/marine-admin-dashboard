import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import PreArrival from "@/models/PreArrival";
import Vessel from "@/models/Vessel"; 
import { authorizeRequest } from "@/lib/authorizeRequest";
import JSZip from "jszip";
import { generatePreArrivalZip } from "@/lib/services/preArrivalService";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeRequest("zip.download");
    if (!authz.ok) return authz.response;

    const { id } = await params;
    const zipBuffer = await generatePreArrivalZip(id);

    if (!zipBuffer) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

   return new NextResponse(Buffer.from(zipBuffer), {
  status: 200,
  headers: {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename=PreArrival_Pack_${id}.zip`,
  },
});

  } catch (error: any) {
    console.error("ZIP Generation Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}