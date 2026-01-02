import { dbConnect } from "@/lib/db";
import Vessel from "@/models/Vessel";
import Voyage from "@/models/Voyage";
import ReportDaily from "@/models/ReportDaily";
import ReportOperational from "@/models/ReportOperational";
import Document from "@/models/Document";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET() {
  try {
    await dbConnect();

    // 1. Static ID for "Alen James"
    const ALEN_JAMES_ID = new mongoose.Types.ObjectId("65a1234567890abcdef12345");

    const vesselsToSeed = [
      { name: "Oceanic Star", imo: "9345678", fleet: "Pacific Bulk", flag: "Panama" },
      { name: "Global Mariner", imo: "9456789", fleet: "Atlantic Carriers", flag: "Liberia" },
      { name: "Nordic Titan", imo: "9567890", fleet: "North Sea Logistics", flag: "Norway" },
      { name: "Desert Rose", imo: "9678901", fleet: "Gulf Shipping", flag: "Marshall Islands" },
      { name: "Pacific Spirit", imo: "9789012", fleet: "Trans-Pacific", flag: "Singapore" },
    ];

    for (const v of vesselsToSeed) {
      // --- STEP 1: UPSERT VESSEL ---
      const vessel = await Vessel.findOneAndUpdate(
        { imo: v.imo },
        {
          $set: {
            name: v.name,
            fleet: v.fleet,
            flag: v.flag,
            status: "active",
            callSign: `CS-${v.imo.slice(-4)}`,
            mmsi: `MID${v.imo}`,
            yearBuilt: 2018,
            dimensions: { loa: 225, beam: 32, maxDraft: 14.5, dwt: 75000, grossTonnage: 42000 },
            performance: { designSpeed: 14.5, ballastConsumption: 25, ladenConsumption: 30 },
            machinery: { mainEngine: "MAN B&W 6S60", allowedFuels: ["VLSFO", "LSMGO"] },
            createdBy: ALEN_JAMES_ID,
            updatedBy: ALEN_JAMES_ID,
          },
        },
        { upsert: true, new: true }
      );

      // --- STEP 2: UPSERT VOYAGE ---
      const voyageNo = `VOY-${v.name.substring(0, 3).toUpperCase()}-2024-01`;
      const voyage = await Voyage.findOneAndUpdate(
        { vesselId: vessel._id, voyageNo: voyageNo },
        {
          $set: {
            status: "active",
            route: { loadPort: "Shanghai", dischargePort: "Rotterdam", totalDistance: 10500 },
            charter: { chartererName: "Alen James Logistics", charterPartyDate: "2024-01-10", laycanStart: "2024-02-01", laycanEnd: "2024-02-10" },
            cargo: { commodity: "Bulk Iron", quantity: 60000, grade: "High" },
            schedule: { startDate: new Date("2024-02-15"), eta: new Date("2024-03-20") },
            createdBy: ALEN_JAMES_ID,
            updatedBy: ALEN_JAMES_ID,
          },
        },
        { upsert: true, new: true }
      );

      // --- STEP 3: SEED 10 DAILY REPORTS ---
      for (let i = 1; i <= 10; i++) {
        const reportDate = new Date(2024, 1, 15 + i);
        await ReportDaily.findOneAndUpdate(
          { vesselId: vessel._id, voyageId: voyage._id, reportDate: reportDate },
          {
            $set: {
              vesselName: vessel.name,
              voyageNo: voyage.voyageNo,
              type: "noon",
              position: { lat: `${20 + i}° N`, long: `${120 + i * 2}° E` },
              navigation: { distLast24h: 320, engineDist: 330, slip: 3.0, distToGo: 10500 - (i * 320), nextPort: "Rotterdam" },
              consumption: { vlsfo: 28.5, lsmgo: 0.5 },
              weather: { wind: "Force 4", seaState: "Moderate", remarks: "Steady sailing" },
              status: "active",
              createdBy: ALEN_JAMES_ID,
            },
          },
          { upsert: true }
        );
      }

      // --- STEP 4: SEED OPERATIONAL REPORTS ---
      const operationalEvents: ("departure" | "arrival" | "nor")[] = ["departure", "arrival", "nor"];
      for (const event of operationalEvents) {
        await ReportOperational.findOneAndUpdate(
          { voyageId: voyage._id, eventType: event },
          {
            $set: {
              vesselId: vessel._id,
              vesselName: vessel.name,
              voyageNo: voyage.voyageNo,
              portName: event === "departure" ? "Shanghai" : "Rotterdam",
              eventTime: new Date(),
              reportDate: new Date(),
              status: "active",
              createdBy: ALEN_JAMES_ID,
              ...(event === "nor" && { norDetails: { documentUrl: "https://dummy-url.com/nor.pdf" } })
            }
          },
          { upsert: true }
        );
      }

      // --- STEP 5: SEED DOCUMENTS ---
      const docTypes: ("stowage_plan" | "cargo_documents" | "other")[] = ["stowage_plan", "cargo_documents", "other"];
      for (const type of docTypes) {
        await Document.findOneAndUpdate(
          { voyageId: voyage._id, documentType: type },
          {
            $set: {
              vesselId: vessel._id,
              portName: "Shanghai",
              portType: "load",
              documentDate: new Date(),
              file: {
                url: `https://dummy-url.com/${type}.pdf`,
                originalName: `${type}_report.pdf`,
                mimeType: "application/pdf",
                sizeBytes: 1024 * 1024
              },
              status: "active",
              createdBy: ALEN_JAMES_ID,
            }
          },
          { upsert: true }
        );
      }
    }

    return NextResponse.json({ success: true, message: "Vessels and related data seeded successfully!" });

  } catch (error: any) {
    console.error("Seed Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}