import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { auth } from "@/auth";

// MODELS
import ReportDaily from "@/models/ReportDaily";
import ReportOperational from "@/models/ReportOperational";
import Document from "@/models/Document";
import Vessel from "@/models/Vessel";

export async function GET() {
  try {
    await dbConnect();

    // 🔒 1. Session & Multi-Tenancy Setup
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = session;
    const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
    const userCompanyId = user.company?.id;

    // 2. Build Base Query Filter
    const filter: any = { status: "active" };

    // =========================================================
    // 🔒 MULTI-TENANCY FILTERING LOGIC
    // =========================================================
    if (!isSuperAdmin) {
      if (!userCompanyId) {
        return NextResponse.json(
          { error: "Access denied: No company assigned to your profile." },
          { status: 403 }
        );
      }

      // Find all vessels belonging to the user's company
      const companyVessels = await Vessel.find({ company: userCompanyId }).select("_id");
      const companyVesselIds = companyVessels.map((v) => v._id);

      // Restrict all counts to these specific vessels
      filter.vesselId = { $in: companyVesselIds };
    }
    // =========================================================

    // 3. Fire all queries simultaneously using Promise.all with the filtered query
    const [
      dailyNoon,
      departure,
      arrival,
      nor,
      cargoStowage,
      cargoDocuments
    ] = await Promise.all([
      // 1) Daily Noon
      ReportDaily.countDocuments({ ...filter, type: "noon" }),
      
      // 2) Departure
      ReportOperational.countDocuments({ ...filter, eventType: "departure" }),
      
      // 3) Arrival
      ReportOperational.countDocuments({ ...filter, eventType: "arrival" }),
      
      // 4) NOR 
      ReportOperational.countDocuments({ ...filter, eventType: "nor" }),
      
      // 5) Cargo Stowage
      Document.countDocuments({ ...filter, documentType: "stowage_plan" }),
      
      // 6) Cargo Documents
      Document.countDocuments({ ...filter, documentType: "cargo_documents" })
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