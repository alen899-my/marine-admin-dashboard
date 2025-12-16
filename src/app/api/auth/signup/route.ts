import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { registerValidation } from "@/lib/validations/userValidation";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();

    // Joi validation
    const { error } = registerValidation.validate(body, { abortEarly: false });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: error.details.map((err) => err.message),
        },
        { status: 400 }
      );
    }

    const { fullName, email, password, role, assignedVesselId } = body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in DB
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
      assignedVesselId: assignedVesselId || null,
      status: "active",
    });

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // Response to client
    const response = NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          assignedVesselId: user.assignedVesselId,
          status: user.status,
        },
      },
      { status: 201 }
    );

    // Optional: set httpOnly cookie
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;

  }catch (err: unknown) {
    // Fixed: Use 'unknown' type and narrow strictly
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}