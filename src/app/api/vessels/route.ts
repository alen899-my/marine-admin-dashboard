// src/app/api/vessels/route.ts
import { NextResponse } from "next/server";
import Vessel from "@/models/Vessel";
import { dbConnect } from "@/lib/db";
import Voyage from "@/models/Voyage";
import { vesselSchema } from "@/lib/validations/vesselSchema"; // Import the Joi schema
import { auth } from "@/auth";
import { authorizeRequest } from "@/lib/authorizeRequest";
import Company from "@/models/Company";
export async function GET(req: Request) {
  try {
     const authz = await authorizeRequest("vessels.view");
    if (!authz.ok) return authz.response;
    await dbConnect();

    // 1. Extract Query Params
    const { searchParams } = new URL(req.url);
    const fetchAll = searchParams.get("all") === "true"; // 🟢 Check for Dropdown Mode

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const companyId = searchParams.get("companyId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 2. Build Filter Object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    let vesselQuery;

    if (fetchAll) {
      // 🟢 MODE A: DROPDOWN (Optimized for Speed)
      // Only fetch active vessels and ONLY the fields we need (ID, Name)
      query.status = "active";
      
      vesselQuery = Vessel.find(query)
        .select("_id name status") // ⚡ PERFORMANCE: Don't fetch heavy fields
        .sort({ name: 1 })         // Alphabetical for dropdowns
        .lean();
        
    } else {
      // 🔵 MODE B: ADMIN LIST (Full Details + Pagination)
      if (status && status !== "all") query.status = status;
      if (companyId) query.company = companyId;
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { imo: { $regex: search, $options: "i" } },
        ];
      }
      
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      vesselQuery = Vessel.find(query)
      .populate("company", "name")
        .populate("createdBy", "fullName")
        .populate("updatedBy", "fullName")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    }

    // 3. Execute Queries
    const [vessels, total] = await Promise.all([
      vesselQuery.exec(),
      Vessel.countDocuments(query),
    ]);

    // =========================================================
    // 🌟 4. ATTACH ACTIVE VOYAGE (Application-Side Join)
    // =========================================================
    
    // Get IDs of the vessels found
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vesselIds = vessels.map((v: any) => v._id);

    // Find Active Voyages for these vessels only
    const activeVoyages = await Voyage.find({
  vesselId: { $in: vesselIds },
  status: "active",
})
.select("vesselId voyageNo schedule.startDate") // 👈 Fetch Start Date too
.lean();

    // Create a Lookup Map (VesselID -> VoyageNo)
    const voyageMap = new Map();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activeVoyages.forEach((voy: any) => {
      voyageMap.set(voy.vesselId.toString(), voy.voyageNo);
    });

    // Merge Data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = vessels.map((v: any) => ({
      ...v,
      activeVoyageNo: voyageMap.get(v._id.toString()) || "", 
    }));
    // =========================================================

    // 5. Return Response
    return NextResponse.json({
      data,
      pagination: {
        total,
        page: fetchAll ? 1 : page,
        totalPages: fetchAll ? 1 : Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("Error fetching vessels:", error);
    return NextResponse.json(
      { error: "Failed to fetch vessels" },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  try {
    const authz = await authorizeRequest("vessels.create");
    if (!authz.ok) return authz.response;
    await dbConnect();
    const session = await auth();
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const body = await request.json();

    // 2. Validate data
    const { error, value } = vesselSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return NextResponse.json({ error: "Validation failed", details }, { status: 400 });
    }

    const validCompany = await Company.findById(value.company);
    if (!validCompany) {
      return NextResponse.json({ error: "The selected company does not exist." }, { status: 400 });
    }

    // ❌ REMOVED: Manual check for existingVessel. 
    // We let the Database throw the error now.

    const vesselData = {
      ...value,
      createdBy: currentUserId,
      updatedBy: currentUserId, 
    };

    const newVessel = await Vessel.create(vesselData) as any;

    const populatedVessel = await Vessel.findById(newVessel._id)
      .populate("company", "name")
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName")
      .lean();

    return NextResponse.json(populatedVessel, { status: 201 });

  } catch (error: any) {
    // ✅ HANDLE DUPLICATES HERE (Covers Name AND IMO)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]; // "name" or "imo"
      const label = field === "imo" ? "IMO Number" : "Vessel Name";
      return NextResponse.json(
        { error: `${label} already exists.` },
        { status: 409 }
      );
    }

    console.error("Error creating vessel:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create vessel" },
      { status: 500 }
    );
  }
}