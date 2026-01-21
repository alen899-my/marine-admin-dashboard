import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import Company from "@/models/Company"; // ✅ 1. IMPORT THIS to fix MissingSchemaError
import Role from "@/models/Role";       // ✅ Recommended: Import Role if you need to check role names

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    // Populate company and role to perform status checks
    const user = await User.findOne({ email })
      .populate("company")
      .populate("role") 
      .lean();

    // 1️⃣ Check if user exists
    if (!user || !user.password) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    // 2️⃣ Password check
    const isValid = await bcrypt.compare(password, user.password as string);
    if (!isValid) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const isSuperAdmin = user.role?.name?.toLowerCase() === "super-admin";

    // 3️⃣ Company Check (Skip for Super Admins)
    if (!isSuperAdmin) {
      if (!user.company) {
        return NextResponse.json({ error: "COMPANY_REQUIRED" }, { status: 403 });
      }

      // Check if company is inactive or soft-deleted
      if (user.company.status !== "active" || user.company.deletedAt !== null) {
        return NextResponse.json({ error: "COMPANY_INACTIVE" }, { status: 403 });
      }
    }

    // 4️⃣ User Account Status Check
    // Check if user is inactive, banned, or soft-deleted
    if (user.status !== "active" || user.deletedAt !== null) {
      return NextResponse.json({ error: "USER_INACTIVE" }, { status: 403 });
    }

    // ✅ Everything OK
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error("PRE-AUTH CHECK ERROR:", error);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}