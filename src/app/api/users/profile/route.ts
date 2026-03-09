import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { handleUpload } from "@/lib/handleUpload";
import bcrypt from "bcryptjs";
import { existsSync } from "fs";
import { unlink } from "fs/promises";
import { del } from "@vercel/blob";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id)
      .select("-password")
      .populate("role", "name") // Fetch the role name (e.g. "Admin", "Manager")
      .populate("company", "name")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const formData = await req.formData();

    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;
    const file = formData.get("profilePicture") as File | null;

    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Handle Profile Picture
    if (file && file.size > 0) {
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: "Max file size is 2MB" }, { status: 400 });
      }

      // 👇 FETCH current user to get old picture URL
      const existingUser = await User.findById(session.user.id).select("profilePicture").lean();
      
      // 👇 DELETE old picture before uploading new one
      if (existingUser?.profilePicture) {
        await deleteFile(existingUser.profilePicture);
      }

      try {
        const uploaded = await handleUpload(file, "profiles");
        updateData.profilePicture = uploaded.url;
      } catch (err) {
        console.error("Profile picture upload failed:", err);
        return NextResponse.json(
          { error: "Failed to upload profile picture." },
          { status: 500 }
        );
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      updateData,
      { new: true }
    )
      .select("-password")
      .populate("role", "name")
      .populate("company", "name");

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("PROFILE UPDATE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 👇 Same deleteFile used in company/user routes
async function deleteFile(fileUrl: string) {
  if (!fileUrl) return;
  try {
    if (process.env.UPLOAD_PROVIDER === "local") {
      let urlPath = fileUrl;
      if (fileUrl.startsWith("http")) {
        urlPath = new URL(fileUrl).pathname;
      }
      const relativePath = urlPath.replace(/^\//, ""); 
      const filePath = path.join(process.cwd(), "public", relativePath);
      if (existsSync(filePath)) {
        await unlink(filePath);
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