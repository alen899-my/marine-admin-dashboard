import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import UserSession from "@/models/UserSession";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authz = await authorizeRequest("sessions.view");
  if (!authz.ok || !authz.session) return authz.response;
  const session = authz.session;

  const awaitedParams = await params;

  await dbConnect();

  const deleted = await UserSession.findByIdAndDelete(awaitedParams.id);

  if (!deleted) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Session deleted" });
}
