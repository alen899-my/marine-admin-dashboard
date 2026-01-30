import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { auth } from "@/auth"; 
import { put } from "@vercel/blob";
import bcrypt from "bcryptjs"; 

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

    // Handle Password Update
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Handle Profile Picture
    if (file && file.size > 0) {
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: "Max file size is 2MB" }, { status: 400 });
      }
      const filename = `profile_${session.user.id}_${Date.now()}`;
      const blob = await put(filename, file, { access: "public", addRandomSuffix: true });
      updateData.profilePicture = blob.url;
    }

    const updatedUser = await User.findByIdAndUpdate(session.user.id, updateData, { new: true })
      .select("-password")
      .populate("role", "name")
      .populate("company", "name");

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("PROFILE UPDATE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}