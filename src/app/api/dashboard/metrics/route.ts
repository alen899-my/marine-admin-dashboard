import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";

// MODELS
import ReportDaily from "@/models/ReportDaily";
import ReportOperational from "@/models/ReportOperational";
import Document from "@/models/Document";

export async function GET() {
  try {
    await dbConnect();

    // Fire all queries simultaneously using Promise.all
    const [
      dailyNoon,
      departure,
      arrival,
      nor,
      cargoStowage,
      cargoDocuments
    ] = await Promise.all([
      // 1) Daily Noon
      ReportDaily.countDocuments({ type: "noon", status: "active" }),
      
      // 2) Departure
      ReportOperational.countDocuments({ eventType: "departure", status: "active" }),
      
      // 3) Arrival
      ReportOperational.countDocuments({ eventType: "arrival", status: "active" }),
      
      // 4) NOR
      ReportOperational.countDocuments({ eventType: "nor", status: "active" }),
      
      // 5) Cargo Stowage
      Document.countDocuments({ documentType: "stowage_plan", status: "active" }),
      
      // 6) Cargo Documents
      Document.countDocuments({ documentType: "cargo_documents", status: "active" })
    ]);

    return NextResponse.json({
      dailyNoon,
      departure,
      arrival,
      nor,
      cargoStowage,
      cargoDocuments,
    });
  } catch (error) {
    console.error("METRICS API ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load metrics" },
      { status: 500 }
    );
  }
}