import { auth } from "@/auth";
import { getCrewStatusMetrics } from "@/lib/services/crew-status";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId") || undefined;

    const data = await getCrewStatusMetrics(session.user, companyId);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Crew Status API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
