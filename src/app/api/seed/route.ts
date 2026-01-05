import { dbConnect } from "@/lib/db";
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage";
import ReportDaily from "@/models/ReportDaily";
import ReportOperational from "@/models/ReportOperational";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();

    // 1. Static ID for the creator
    const ADMIN_ID = new mongoose.Types.ObjectId("65a1234567890abcdef12345");

    // 2. Setup Vessel
    const vessel = await Vessel.findOneAndUpdate(
      { imo: "9998887" },
      { 
        $set: { 
          name: "Falcon Express", 
          imo: "9998887", 
          status: "active", 
          createdBy: ADMIN_ID,
          updatedBy: ADMIN_ID 
        } 
      },
      { upsert: true, new: true }
    );

    // 3. Setup Voyage
    const voyage = await Voyage.findOneAndUpdate(
      { vesselId: vessel._id, voyageNo: "TEST-3DAY-01" },
      {
        $set: {
          status: "active",
          route: { loadPort: "Mumbai", dischargePort: "Dubai", totalDistance: 1200 },
          createdBy: ADMIN_ID,
          updatedBy: ADMIN_ID,
        },
      },
      { upsert: true, new: true }
    );

    // --- TIMELINE DEFINITION ---
    const tDeparture = new Date("2026-01-01T10:00:00Z");
    const tNoon1     = new Date("2026-01-02T12:00:00Z");
    const tNoon2     = new Date("2026-01-03T12:00:00Z");
    const tArrival   = new Date("2026-01-04T10:00:00Z"); // Exactly 72 Hours Total

    // 4. Seed Departure Report
    await ReportOperational.findOneAndUpdate(
      { voyageId: voyage._id, eventType: "departure" },
      {
        $set: {
          vesselId: vessel._id,
          vesselName: vessel.name,
          voyageNo: voyage.voyageNo,
          eventType: "departure",
          portName: "Mumbai",
          eventTime: tDeparture,
          reportDate: tDeparture,
          departureStats: {
            robVlsfo: 500,
            robLsmgo: 100,
            bunkersReceivedVlsfo: 0,
          },
          status: "active",
          createdBy: ADMIN_ID,
        }
      },
      { upsert: true }
    );

    // 5. Seed Two Noon Reports (Distances: 390 + 360 = 750 NM)
    const noonReports = [
      { date: tNoon1, dist: 390, vlsfo: 20 },
      { date: tNoon2, dist: 360, vlsfo: 20 },
    ];

    for (const data of noonReports) {
      await ReportDaily.findOneAndUpdate(
        { voyageId: voyage._id, reportDate: data.date },
        {
          $set: {
            vesselId: vessel._id,
            vesselName: vessel.name,
            voyageNo: voyage.voyageNo,
            reportDate: data.date,
            type: "noon",
            position: { lat: "18N", long: "70E" },
            navigation: { 
              distLast24h: data.dist, 
              engineDist: data.dist + 5, 
              slip: 1.5,
              distToGo: 500,
              nextPort: "Dubai" 
            },
            consumption: { vlsfo: data.vlsfo, lsmgo: 2 },
            status: "active",
            createdBy: ADMIN_ID,
          },
        },
        { upsert: true }
      );
    }

    // 6. Seed Arrival Report
    await ReportOperational.findOneAndUpdate(
      { voyageId: voyage._id, eventType: "arrival" },
      {
        $set: {
          vesselId: vessel._id,
          vesselName: vessel.name,
          voyageNo: voyage.voyageNo,
          eventType: "arrival",
          portName: "Dubai",
          eventTime: tArrival,
          reportDate: tArrival,
          arrivalStats: {
            robVlsfo: 440, // (500 start - 440 end = 60 MT Consumed)
            robLsmgo: 95,  // (100 start - 95 end = 5 MT Consumed)
            arrivalCargoQtyMt: 45000,
          },
          status: "active",
          createdBy: ADMIN_ID,
        }
      },
      { upsert: true }
    );

    return NextResponse.json({ 
      success: true, 
      message: "3-Day Voyage Test Data Seeded!",
      expected_output: {
        steaming: "72.00 Hrs",
        distance: "750.00 NM",
        speed: "10.42 Kts",
        fuel_vlsfo: "60.00 MT"
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}