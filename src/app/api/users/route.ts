import { dbConnect } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import Role from "@/models/Role"; 
import bcrypt from "bcryptjs";
import { authorizeRequest } from "@/lib/authorizeRequest";
export async function POST(req: NextRequest) {
  try {
    const authz = await authorizeRequest("users.create");
    if (!authz.ok) return authz.response;
    await dbConnect();

    const body = await req.json();
    let { name, email, phone, password, role, additionalPermissions, excludedPermissions } = body;

    // ✅ Fallback: If no role provided, default to 'op-staff'
    if (!role) {
      const defaultRole = await Role.findOne({ 
        $or: [{ name: "op-staff" }, { slug: "op-staff" }] 
      });
      
      if (defaultRole) {
        role = defaultRole._id;
      } else {
        return NextResponse.json(
          { error: "Default 'op-staff' role not found. Please select a role." },
          { status: 400 }
        );
      }
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, or password" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    const validRole = await Role.findById(role);
    if (!validRole) {
      return NextResponse.json({ error: "Invalid Role ID provided" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName: name, 
      email: email,
      phone: phone,
      password: hashedPassword,
      role: role, 
      additionalPermissions: additionalPermissions || [], 
      excludedPermissions: excludedPermissions || [],
      status: "active",
    });

    return NextResponse.json({ success: true, userId: newUser._id ,roleId: newUser.role}, { status: 201 });

  } catch (error: any) {
    console.error("CREATE USER ERROR →", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ... GET function remains unchanged
export async function GET(req: NextRequest) {
   // ... (existing code)
   try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    const query: any = {};

    if (status !== "all") query.status = status;

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (startDate || endDate) {
      const dateQuery: any = {};
      if (startDate) dateQuery.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.$lte = end;
      }
      if (Object.keys(dateQuery).length > 0) query.createdAt = dateQuery;
    }

    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .select("-password")
      .populate("role", "name") 
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
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}