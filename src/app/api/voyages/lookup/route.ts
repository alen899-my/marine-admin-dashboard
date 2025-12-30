import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Voyage from "@/models/Voyage";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const vesselId = searchParams.get("vesselId");
    const dateStr = searchParams.get("date");

    if (!vesselId || !dateStr) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const reportDate = new Date(dateStr);

    // 🔍 THE GOLD STANDARD QUERY
    // Find a voyage where:
    // 1. It belongs to this vessel
    // 2. It started BEFORE (or on) the report date
    // 3. It ended AFTER (or on) the report date OR it hasn't ended yet (active)
    const voyage = await Voyage.findOne({
      vesselId: vesselId,
      "schedule.startDate": { $lte: reportDate }, // Start <= Date
      $or: [
        { "schedule.endDate": { $gte: reportDate } }, // End >= Date
        { "schedule.endDate": null },                 // OR End is null (Still going)
        { "schedule.endDate": { $exists: false } }    // OR End doesn't exist
      ]
    })
    .sort({ "schedule.startDate": -1 }) // Get the most recent match if overlap
    .select("voyageNo");

    if (!voyage) {
      return NextResponse.json({ voyageNo: "" });
    }

    return NextResponse.json({ voyageNo: voyage.voyageNo });

  } catch (error) {
    console.error("Error looking up voyage:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}