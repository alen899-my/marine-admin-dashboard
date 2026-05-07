import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function authorizeRequest(permission: string | string[]) {
  const session = await auth();

  if (!session || !session.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const role = session.user.role;
  const permissionsToCheck = Array.isArray(permission)
    ? permission
    : [permission];

  //  SUPER ADMIN BYPASS — ABSOLUTE
  if (role === "super-admin") {
    return { ok: true, session };
  }

  const hasPermission = permissionsToCheck.some((item) =>
    session.user.permissions?.includes(item),
  );

  if (!hasPermission) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, session };
}
