import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { signinValidation } from "@/lib/validations/signinValidation";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    // Joi validation
    const { error } = signinValidation.validate(body, { abortEarly: false });

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

    const { email, password } = body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create JWT token (include role)
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // JSON response
    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          assignedVesselId: user.assignedVesselId,
          status: user.status,
          lastLogin: user.lastLogin,
        },
      },
      { status: 200 }
    );

    // Set HttpOnly cookie
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

  } catch (error: unknown) {
    // Fixed: Use 'unknown' and narrow type to access message safely
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    
    return NextResponse.json(
      {
        success: false,
        message: "Server Error",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}