import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import UserSession from "@/models/UserSession";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: true }); // already signed out
  }

  const { sessionId } = await req.json();

  if (sessionId) {
    await dbConnect();
    await UserSession.findOneAndUpdate(
      { sessionId, userId: session.user.id },
      { $set: { isValid: false, invalidatedAt: new Date() } }
    );
  }

  return NextResponse.json({ ok: true });
}
