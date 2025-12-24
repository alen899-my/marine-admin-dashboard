import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { authorizeRequest } from "@/lib/authorizeRequest";
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {   
        const authz = await authorizeRequest("users.edit");
        if (!authz.ok) return authz.response;
    await dbConnect();

    const { id } = await params;
    const body = await req.json();

    // 1. Destructure all fields from the Frontend payload
    const { 
      name, // Frontend sends 'name', Schema uses 'fullName'
      email, 
      phone, 
      role, 
      status, 
      password, 
      additionalPermissions, 
      excludedPermissions 
    } = body;

    // 2. Prepare the Update Object
    const updateData: any = {
      fullName: name, 
      email,
      phone,
      role,
      status,
      // ✅ CRITICAL: This saves your Green Ticks (Added)
      additionalPermissions: additionalPermissions || [],
      // ✅ CRITICAL: This saves your Red Crosses (Removed)
      excludedPermissions: excludedPermissions || [],
    };

    // 3. Password Handling (Only update if user typed a new one)
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // 4. Update Database
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password"); // Return user without password

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error: any) {
    console.error("UPDATE USER ERROR →", error);
    
    // Handle Duplicate Email Error specifically
    if (error.code === 11000) {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
         const authz = await authorizeRequest("users.delete");
        if (!authz.ok) return authz.response;

    await dbConnect();

    const { id } = await params;

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