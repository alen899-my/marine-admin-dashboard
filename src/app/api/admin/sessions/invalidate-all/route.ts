import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import UserSession from "@/models/UserSession";

export async function POST(req: NextRequest) {
  const authz = await authorizeRequest("sessions.view");
  if (!authz.ok || !authz.session) return authz.response;
  const session = authz.session;

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  await dbConnect();

  await UserSession.deleteMany({ userId });

  return NextResponse.json({ message: "All sessions for user deleted" });
}
