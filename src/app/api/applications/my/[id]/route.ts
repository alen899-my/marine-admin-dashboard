// app/api/applications/my/[id]/route.ts
// Thin wrapper — uses applicationService which handles auth/ownership check.
// Only one GET endpoint needed; the list is fetched SSR in careers/page.tsx.

import { auth } from "@/auth";
import { getMyApplicationById } from "@/lib/services/applicationService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getMyApplicationById(session.user.id, id);

    if (!data) {
      return NextResponse.json({ error: "Not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("GET MY APPLICATION [id] ERROR →", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}