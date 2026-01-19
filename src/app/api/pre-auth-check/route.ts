import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  await dbConnect();
  const { email, password } = await req.json();

  const user = await User.findOne({ email })
    .populate("company")
    .lean();

  // 1️⃣ Invalid credentials
  if (!user || !user.password) {
    return NextResponse.json(
      { error: "INVALID_CREDENTIALS" },
      { status: 401 }
    );
  }

  // 2️⃣ Password check
  const isValid = await bcrypt.compare(password, user.password as string);
  if (!isValid) {
    return NextResponse.json(
      { error: "INVALID_CREDENTIALS" },
      { status: 401 }
    );
  }


  if (!user.company) {
    return NextResponse.json(
      { error: "COMPANY_REQUIRED" },
      { status: 403 }
    );
  }

  if (
    user.company.status !== "active" ||
    user.company.deletedAt
  ) {
    return NextResponse.json(
      { error: "COMPANY_INACTIVE" },
      { status: 403 }
    );
  }

  // 4️⃣ User inactive (checked LAST)
  if (user.status !== "active") {
    return NextResponse.json(
      { error: "USER_INACTIVE" },
      { status: 403 }
    );
  }

  // ✅ Everything OK
  return NextResponse.json({ ok: true });
}
