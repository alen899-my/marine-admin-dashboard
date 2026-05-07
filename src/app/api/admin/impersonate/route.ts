import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";
import Role from "@/models/Role";
import User from "@/models/User";
import { NextResponse } from "next/server";

/** POST /api/admin/impersonate — start impersonating a user */
export async function POST(req: Request) {
  const session = await auth();

  // Only real super-admins (not already impersonating) can use this
  if (
    !session?.user ||
    session.user.role?.toLowerCase() !== "super-admin" ||
    session.impersonation?.active
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { targetUserId } = await req.json();
  if (!targetUserId) {
    return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
  }

  // Cannot impersonate yourself
  if (targetUserId === session.user.id) {
    return NextResponse.json({ error: "Cannot impersonate yourself" }, { status: 400 });
  }

  await dbConnect();

  const targetUser = await User.findById(targetUserId)
    .populate({ path: "role", model: Role })
    .populate({ path: "company", model: Company })
    .lean();

  if (!targetUser || targetUser.status !== "active") {
    return NextResponse.json({ error: "Target user not found or inactive" }, { status: 404 });
  }

  const targetRoleName: string = (targetUser.role as any)?.name || "user";

  // Do not allow impersonating another super-admin
  if (targetRoleName.toLowerCase() === "super-admin") {
    return NextResponse.json(
      { error: "Cannot impersonate another super-admin" },
      { status: 403 }
    );
  }

  const basePerms: string[] = (targetUser.role as any)?.permissions || [];
  const additional: string[] = targetUser.additionalPermissions || [];
  const excluded: string[] = targetUser.excludedPermissions || [];
  const targetPermissions = Array.from(new Set([...basePerms, ...additional])).filter(
    (p) => !excluded.includes(p)
  );

  return NextResponse.json({
    impersonation: {
      active: true as const,
      targetUserId: (targetUser._id as any).toString(),
      targetFullName: targetUser.fullName,
      targetEmail: targetUser.email,
      targetRole: targetRoleName,
      targetPermissions,
      targetProfilePicture: targetUser.profilePicture ?? null,
      targetCompany: targetUser.company
        ? {
            id: (targetUser.company as any)._id.toString(),
            name: (targetUser.company as any).name,
          }
        : null,
    },
  });
}

/** DELETE /api/admin/impersonate — stop impersonating */
export async function DELETE() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The actual token clear is done client-side via update()
  return NextResponse.json({ success: true });
}
