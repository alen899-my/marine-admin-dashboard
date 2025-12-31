import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage";
import User from "@/models/User";

export async function GET() {
  try {
    await dbConnect();

    /* --------------------------------------------------
       1. FIND A REAL SYSTEM USER (REQUIRED)
    -------------------------------------------------- */
    const systemUser = await User.findOne({}).select("_id");

    if (!systemUser) {
      return NextResponse.json(
        { error: "No users found. Create a user first." },
        { status: 400 }
      );
    }

    const systemUserId = systemUser._id;

    /* --------------------------------------------------
       2. SEED VESSELS (UPSERT — NO DELETES)
    -------------------------------------------------- */
    const vesselsToSeed = [
      {
        name: "AN16",
        imo: "9876543",
        fleet: "Main Fleet",
        status: "active",
        callSign: "VAN16",
        mmsi: "419000001",
        flag: "India",
        yearBuilt: 2015,

        dimensions: {
          loa: 180,
          beam: 30,
          maxDraft: 10,
          dwt: 28000,
          grossTonnage: 18000,
        },

        performance: {
          designSpeed: 14,
          ballastConsumption: 18,
          ladenConsumption: 25,
        },

        machinery: {
          mainEngine: "MAN B&W 6S60MC",
          allowedFuels: ["VLSFO", "LSMGO"],
        },

        createdBy: systemUserId,
        updatedBy: systemUserId,
      },
    ];

    const seededVessels = [];

    for (const vessel of vesselsToSeed) {
      const savedVessel = await Vessel.findOneAndUpdate(
        { imo: vessel.imo },                // 🔒 Unique key
        { $set: vessel },
        { upsert: true, new: true }
      );
      seededVessels.push(savedVessel);
    }

    /* --------------------------------------------------
       3. SEED VOYAGES (LINKED TO VESSELS)
    -------------------------------------------------- */
    const voyagesToSeed = seededVessels.map((vessel) => ({
      vesselId: vessel._id,
      voyageNo: "VOY-001",
      status: "active",

      route: {
        loadPort: "Kandla",
        dischargePort: "Singapore",
        via: "Colombo",
        totalDistance: 2400,
      },

      charter: {
        chartererName: "ABC Chartering",
        charterPartyDate: "2024-01-10",
        laycanStart: "2024-01-20",
        laycanEnd: "2024-01-25",
      },

      cargo: {
        commodity: "Coal",
        quantity: 25000,
        grade: "Thermal",
      },

      schedule: {
        startDate: new Date("2024-01-20"),
        eta: new Date("2024-02-02"),
      },

      createdBy: systemUserId,
      updatedBy: systemUserId,
    }));

    for (const voyage of voyagesToSeed) {
      await Voyage.findOneAndUpdate(
        {
          vesselId: voyage.vesselId,
          voyageNo: voyage.voyageNo, // 🔒 compound unique index
        },
        { $set: voyage },
        { upsert: true, new: true }
      );
    }

    /* --------------------------------------------------
       4. SUCCESS RESPONSE
    -------------------------------------------------- */
    return NextResponse.json({
      success: true,
      message: "Vessels & voyages seeded successfully",
      vessels: seededVessels.map((v) => ({
        id: v._id,
        name: v.name,
        imo: v.imo,
      })),
    });

  } catch (error: any) {
    console.error("SEED ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Seed failed" },
      { status: 500 }
    );
  }
}
