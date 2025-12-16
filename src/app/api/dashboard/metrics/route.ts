import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";

// MODELS
import ReportDaily from "@/models/ReportDaily";
import ReportOperational from "@/models/ReportOperational";
import Document from "@/models/Document";

export async function GET() {
  try {
    await dbConnect();

    // 1) Daily Noon Reports
    const dailyNoon = await ReportDaily.countDocuments({
      type: "noon",
      status: "active",
    });

    // 2) Departure Reports
    const departure = await ReportOperational.countDocuments({
      eventType: "departure",
      status: "active",
    });

    // 3) Arrival Reports
    const arrival = await ReportOperational.countDocuments({
      eventType: "arrival",
      status: "active",
    });

    // 4) NOR Reports
    const nor = await ReportOperational.countDocuments({
      eventType: "nor",
      status: "active",
    });

    // 5) Cargo Stowage Reports (Documents)
    const cargoStowage = await Document.countDocuments({
      documentType: "stowage_plan",
      status: "active",
    });
    
    // 6) Cargo Documents (Documents)
    const cargoDocuments = await Document.countDocuments({
      documentType: "cargo_documents",
      status: "active",
    });

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
