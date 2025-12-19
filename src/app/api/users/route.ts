import { dbConnect } from "@/lib/db"; // ✅ Using your existing connection
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// CREATE USER
export async function POST(req: NextRequest) {
  try {
    // 1. Connect to DB
    await dbConnect();

    // 2. Parse Body
    const body = await req.json();
    const { name, email, phone, password } = body;

    // 3. Basic Validation (Backend fallback)
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, or password" },
        { status: 400 }
      );
    }

    // 4. Check if User Exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 } // 409 Conflict
      );
    }

    // 5. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Create User
    // Mapping frontend 'name' -> DB 'fullName'
    const newUser = await User.create({
      fullName: name, 
      email: email,
      phone: phone,
      password: hashedPassword,
      role: "crew_manager", // Default role for this form
      status: "active",
    });

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        userId: newUser._id,
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error("CREATE USER ERROR →", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
      
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    
    // Optional: Filter by creation date
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    // --- Build Query ---
    const query: any = {};

    // 1. Status Filter
    if (status !== "all") {
      query.status = status;
    }

    // 2. Search Filter (Name, Email, Phone)
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ];
    }

    // 3. Date Filter (on createdAt)
    if (startDate || endDate) {
      const dateQuery: any = {};
      if (startDate) dateQuery.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.$lte = end;
      }
      if (Object.keys(dateQuery).length > 0) {
        query.createdAt = dateQuery;
      }
    }

    // --- Fetch Data ---
    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .select("-password") // ❌ Exclude password
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET USERS ERROR →", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}