import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import Role from "@/models/Role";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { authorizeRequest } from "@/lib/authorizeRequest";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { put } from "@vercel/blob";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeRequest("users.edit");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const { id } = await context.params;

    // 1. Parse FormData
    // This will now work because we will fix the client to always send FormData
    const formData = await req.formData();

    // 2. Find User first
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Prepare Update Object (Dynamic Construction)
    const updateData: any = {};

    // Only update fields if they are present in the FormData
    if (formData.has("name")) updateData.fullName = formData.get("name") as string;
    if (formData.has("email")) updateData.email = formData.get("email") as string;
    if (formData.has("phone")) updateData.phone = formData.get("phone") as string;
    if (formData.has("role")) updateData.role = formData.get("role") as string;
    if (formData.has("status")) updateData.status = formData.get("status") as string;

    // Password logic
    const password = formData.get("password") as string;
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Permission Arrays (Parse JSON strings)
    if (formData.has("additionalPermissions")) {
      try {
        updateData.additionalPermissions = JSON.parse(formData.get("additionalPermissions") as string);
      } catch (e) { console.warn("Invalid additionalPermissions JSON"); }
    }

    if (formData.has("excludedPermissions")) {
      try {
        updateData.excludedPermissions = JSON.parse(formData.get("excludedPermissions") as string);
      } catch (e) { console.warn("Invalid excludedPermissions JSON"); }
    }

    // 4. Handle Profile Picture
    const file = formData.get("profilePicture") as File | null;
    if (file && file.size > 0) {
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: "Profile picture exceeds 2MB." }, { status: 400 });
      }

      const filename = `user_${Date.now()}_${file.name.replace(/\s/g, "_")}`;

      if (process.env.NODE_ENV === "development") {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = path.join(process.cwd(), "public/uploads/users");
        if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);
        updateData.profilePicture = `/uploads/users/${filename}`;
      } else {
        const blob = await put(filename, file, { access: "public", addRandomSuffix: true });
        updateData.profilePicture = blob.url;
      }
    }

    // 5. Update Database
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData, // Use the dynamically built object
      { new: true, runValidators: true }
    ).select("-password");

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error: any) {
    console.error("UPDATE USER ERROR →", error);
    if (error.code === 11000) return NextResponse.json({ error: "Email exists" }, { status: 409 });
    return NextResponse.json({ error: error.message || "Failed update" }, { status: 500 });
  }
}
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authz = await authorizeRequest("users.delete");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const { id } = await context.params;

    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("DELETE USER ERROR →", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}