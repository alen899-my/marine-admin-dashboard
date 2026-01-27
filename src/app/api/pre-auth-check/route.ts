import { dbConnect } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

// 1. Import all models to ensure they are registered in Mongoose
import Company from "@/models/Company";
import Role from "@/models/Role";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await dbConnect();

    //  2. Explicitly reference models to prevent tree-shaking/registration issues
    // This ensures Mongoose knows about these schemas before .populate() runs
    const _ensureModels = [User, Company, Role];

    const { email, password } = await req.json();

    // 3. Find user and populate necessary fields for status checks
    const user = await User.findOne({ email })
      .populate("company")
      .populate("role")
      .lean();

    // --- Validation Logic ---

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "INVALID_CREDENTIALS" },
        { status: 401 },
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "INVALID_CREDENTIALS" },
        { status: 401 },
      );
    }

    const roleName = user.role?.name?.toLowerCase();
    const isSuperAdmin = roleName === "super-admin";

    if (!isSuperAdmin) {
      if (!user.company) {
        return NextResponse.json(
          { error: "COMPANY_REQUIRED" },
          { status: 403 },
        );
      }

      if (user.company.status !== "active" || user.company.deletedAt) {
        return NextResponse.json(
          { error: "COMPANY_INACTIVE" },
          { status: 403 },
        );
      }
    }

    // 5. User Status Check
    if (user.status !== "active" || user.deletedAt) {
      return NextResponse.json({ error: "USER_INACTIVE" }, { status: 403 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("PRE-AUTH CHECK ERROR:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", details: error.message },
      { status: 500 },
    );
  }
}
