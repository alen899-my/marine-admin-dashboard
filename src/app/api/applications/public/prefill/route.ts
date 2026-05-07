// app/api/applications/public/prefill/route.ts
// Returns the authenticated user's most recent application data for pre-filling
// a new application form. Job-specific fields are excluded at the service layer.

import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { getLastApplicationByUser } from "@/lib/services/applicationService";

export async function GET(req: NextRequest) {
  try {
    // ── 1. Auth check ──────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. Fetch last application ──────────────────────────────────────────
    const data = await getLastApplicationByUser(session.user.id);
    console.log("PREFILL →", {
  profilePhoto: data?.profilePhoto,
  resume: data?.resume,
});
    if (!data) {
      return NextResponse.json(
        { success: false, message: "No previous application found." },
        { status: 404 }
      );
    }

    // ── 3. Return ──────────────────────────────────────────────────────────
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error("PREFILL ROUTE ERROR →", error);
    return NextResponse.json(
      { error: "Failed to fetch previous application." },
      { status: 500 }
    );
  }
}