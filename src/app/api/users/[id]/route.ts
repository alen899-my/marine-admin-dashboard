import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";
import Role from "@/models/Role";
import User from "@/models/User";
import { put } from "@vercel/blob";
import bcrypt from "bcryptjs";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { handleUpload } from "@/lib/handleUpload";
import { buildCompanyUploadFolder } from "@/lib/uploadFolders";
import { del } from "@vercel/blob";
import { unlink } from "fs/promises";
import mongoose from "mongoose";
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
    const formData = await req.formData();

    // 2. Find User first
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    let targetCompanyName: string | null = null;
    if (user.company) {
      const currentCompany = await Company.findById(user.company).select("name").lean();
      targetCompanyName = currentCompany?.name || null;
    }

    // 3. Prepare Update Object
    const updateData: any = {};

    if (formData.has("name")) updateData.fullName = formData.get("name") as string;
    if (formData.has("email")) updateData.email = formData.get("email") as string;
    if (formData.has("phone")) updateData.phone = formData.get("phone") as string;
    if (formData.has("role")) {
      const roleValue = formData.get("role") as string;
      let validRole;
      if (mongoose.Types.ObjectId.isValid(roleValue)) {
        validRole = await Role.findById(roleValue);
      } else {
        validRole = await Role.findOne({ name: roleValue.toLowerCase() });
      }
      if (!validRole) {
        return NextResponse.json({ error: "Invalid Role ID or name" }, { status: 400 });
      }
      updateData.role = validRole._id;
    }
    if (formData.has("status")) updateData.status = formData.get("status") as string;

    if (formData.has("company")) {
      const newCompanyId = formData.get("company") as string;
      const oldCompanyId = user.company?.toString();

      if (newCompanyId !== oldCompanyId) {
        const companyExists = await Company.findById(newCompanyId);
        if (!companyExists) {
          return NextResponse.json({ error: "Invalid Company ID" }, { status: 400 });
        }

        updateData.company = newCompanyId;
        targetCompanyName = companyExists.name;

        if (oldCompanyId) {
          await Company.findByIdAndUpdate(oldCompanyId, { $pull: { users: id } });
        }
        await Company.findByIdAndUpdate(newCompanyId, { $addToSet: { users: id } });
      }
    }

    // Password
    const password = formData.get("password") as string;
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
      updateData.passwordChangedAt = new Date();
    }

    // Permission Arrays
    if (formData.has("additionalPermissions")) {
      try {
        updateData.additionalPermissions = JSON.parse(
          formData.get("additionalPermissions") as string
        );
      } catch (e) {
        console.warn("Invalid additionalPermissions JSON");
      }
    }

    if (formData.has("excludedPermissions")) {
      try {
        updateData.excludedPermissions = JSON.parse(
          formData.get("excludedPermissions") as string
        );
      } catch (e) {
        console.warn("Invalid excludedPermissions JSON");
      }
    }

    // 4. Handle Profile Picture
    const file = formData.get("profilePicture") as File | null;
    if (file && file.size > 0) {
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Profile picture exceeds 2MB." },
          { status: 400 }
        );
      }
      const oldPicUrl = user.profilePicture;
      if (oldPicUrl) {
        await deleteFile(oldPicUrl);
      }

      try {
        const uploaded = await handleUpload(
          file,
          buildCompanyUploadFolder({
            companyName: targetCompanyName,
            module: "user-profile",
            entityName: (formData.get("name") as string) || user.fullName,
          }),
        );
        updateData.profilePicture = uploaded.url;
      } catch (err) {
        console.error("Profile picture upload failed:", err);
        return NextResponse.json(
          { error: "Failed to upload profile picture." },
          { status: 500 }
        );
      }
    }

    // 5. Update Database
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("UPDATE USER ERROR →", error);
    if (error.code === 11000)
      return NextResponse.json({ error: "Email exists" }, { status: 409 });
    return NextResponse.json(
      { error: error.message || "Failed update" },
      { status: 500 }
    );
  }
}


export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authorization check
    const authz = await authorizeRequest("users.delete");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const { id } = await context.params;
    const now = new Date();

    // 2. Perform Soft Delete
    // We update status to 'deleted' and record the timestamp
    const deletedUser = await User.findByIdAndUpdate(
      id,
      { 
        $set: { 
          status: "inactive", 
          deletedAt: now 
        } 
      },
      { new: true }
    );

    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Remove User from Company's active user list
    // Even though the user record still exists, we pull them from the 
    // Company array so they don't block company deletion logic.
    if (deletedUser.company) {
      await Company.findByIdAndUpdate(deletedUser.company, {
        $pull: { users: id },
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE USER ERROR →", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
async function deleteFile(fileUrl: string) {
  if (!fileUrl) return;
  try {
    if (process.env.UPLOAD_PROVIDER === "local") {
      let urlPath = fileUrl;
      if (fileUrl.startsWith("http")) {
        urlPath = new URL(fileUrl).pathname;
      }
      const uploadsPrefix = "/uploads/";
      if (urlPath.startsWith(uploadsPrefix)) {
        const relativePath = urlPath.slice(uploadsPrefix.length);
        const filePath = path.join(process.cwd(), "public", "uploads", relativePath);
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      }
    } else {
      if (fileUrl.startsWith("http")) {
        await del(fileUrl);
      }
    }
  } catch (error) {
    console.error("Error deleting file:", error);
  }
}
