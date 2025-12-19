// src/app/api/vessels/route.ts
import { NextResponse } from "next/server";
import Vessel from "@/models/Vessel";
import { dbConnect } from "@/lib/db";

export async function GET() {
  try {
    await dbConnect();
    // Fetch only active vessels and only the name field to keep it lightweight
    const vessels = await Vessel.find({ status: "active" }).select("name").lean();
    return NextResponse.json(vessels);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch vessels" }, { status: 500 });
  }
}