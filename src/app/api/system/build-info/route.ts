import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const dbState: Record<number, string> = {
      0: "Disconnected",
      1: "Connected",
      2: "Connecting",
      3: "Disconnecting",
    };

    const connection = mongoose.connection;

    return NextResponse.json({
      db: {
        status: dbState[connection.readyState] || "Unknown",
        name: connection.name || "unknown",
        driver: `Mongoose v${mongoose.version}`,
      },
    });
  } catch (error) {
    console.error("Build info error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}