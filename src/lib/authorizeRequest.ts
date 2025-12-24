import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function authorizeRequest(permission: string) {
  const session = await auth();

  if (!session || !session.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const role = session.user.role;

  // ✅ SUPER ADMIN BYPASS — ABSOLUTE
  if (role === "super-admin") {
    return { ok: true, session };
  }

  if (!session.user.permissions?.includes(permission)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, session };
}
