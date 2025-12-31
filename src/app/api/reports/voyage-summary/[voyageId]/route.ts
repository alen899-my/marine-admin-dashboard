import { dbConnect } from "@/lib/db";
import ReportDaily from "@/models/ReportDaily";
import ReportOperational from "@/models/ReportOperational";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ voyageId: string }> }
) {
  try {
    await dbConnect();

    const { voyageId } = await params;

    // Validation
    if (!voyageId || voyageId === "undefined") {
      return NextResponse.json(
        { error: "Voyage ID is missing" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(voyageId)) {
      return NextResponse.json(
        { error: "Invalid Voyage ID Format" },
        { status: 400 }
      );
    }

    const vId = new mongoose.Types.ObjectId(voyageId);

    // Fetch reports in parallel
    const [departure, arrival, noonReports] = await Promise.all([
      ReportOperational.findOne({
        voyageId: vId,
        eventType: "departure",
        status: "active",
      }).lean(),
      ReportOperational.findOne({
        voyageId: vId,
        eventType: "arrival",
        status: "active",
      }).lean(),
      ReportDaily.find({ voyageId: vId, status: "active" }).lean(),
    ]);

    if (!departure || !arrival) {
      return NextResponse.json(
        { error: "Insufficient data to generate summary." },
        { status: 404 }
      );
    }

    // Calculations
    const arrTime = new Date(
      arrival.eventTime || arrival.reportDate!
    ).getTime();
    const depTime = new Date(
      departure.eventTime || departure.reportDate!
    ).getTime();
    const totalTimeHours = Math.max(0, (arrTime - depTime) / (1000 * 60 * 60));

    const totalDistance = noonReports.reduce(
      (sum, doc) => sum + (Number(doc.navigation?.distLast24h) || 0),
      0
    );
    const avgSpeed = totalTimeHours > 0 ? totalDistance / totalTimeHours : 0;

    // Helper for Fuel Consumption
    const getConsumed = (type: "vlsfo" | "lsmgo") => {
      const depKey =
        `rob${type.toUpperCase()}` as keyof typeof departure.departureStats;
      const bunkKey =
        `bunkersReceived${type.toUpperCase()}` as keyof typeof departure.departureStats;
      const arrKey = `rob${
        type.charAt(0).toUpperCase() + type.slice(1)
      }` as keyof typeof arrival.arrivalStats;

      const dep = Number(departure.departureStats?.[depKey]) || 0;
      const bunk = Number(departure.departureStats?.[bunkKey]) || 0;
      const arr = Number(arrival.arrivalStats?.[arrKey]) || 0;

      return dep + bunk - arr;
    };

    return NextResponse.json({
      success: true,
      metrics: {
        totalTimeHours: Number(totalTimeHours.toFixed(2)),
        totalDistance: Number(totalDistance.toFixed(2)),
        avgSpeed: Number(avgSpeed.toFixed(2)),
        consumedVlsfo: Number(getConsumed("vlsfo").toFixed(2)),
        consumedLsmgo: Number(getConsumed("lsmgo").toFixed(2)),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
