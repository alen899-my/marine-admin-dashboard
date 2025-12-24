import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import Role from "@/models/Role"; // Import Role model
import { registerValidation } from "@/lib/validations/userValidation";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    // 1. Validation
    const { error } = registerValidation.validate(body, { abortEarly: false });
    if (error) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: error.details.map((e) => e.message) },
        { status: 400 }
      );
    }

    const { fullName, email, password, role, assignedVesselId } = body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email already exists" },
        { status: 409 }
      );
    }

    const roleDoc = await Role.findOne({ name: role }); // Adjust logic if you store slugs instead of names
    // Fallback: If no role found, you might default to 'viewer' or return error
    if (!roleDoc && role !== 'admin') { 
        // Handle case where role doesn't exist yet
    }

    // 4. Create User
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: roleDoc?._id, // Save the ObjectId, not the string
      assignedVesselId: assignedVesselId || null,
      status: "active",
    });

    // 5. Response (NO TOKEN HERE - NextAuth handles that on login)
    return NextResponse.json(
      { success: true, message: "User registered successfully" },
      { status: 201 }
    );

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json(
      { success: false, message: "Server error", error: errorMessage },
      { status: 500 }
    );
  }
}