import { dbConnect } from "@/lib/db";
import Permission from "@/models/Permission";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();
    // Return all permissions, sorted alphabetically by slug
    const permissions = await Permission.find({ status: "active" }).sort({ slug: 1 });
    return NextResponse.json(permissions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
  }
}