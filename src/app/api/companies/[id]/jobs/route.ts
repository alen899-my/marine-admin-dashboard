import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Job from "@/models/Job";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await dbConnect();

  const jobs = await Job.find({ companyId: id, isAccepting: true })
    .select("title _id")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ success: true, jobs });
}
