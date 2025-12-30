import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Voyage from "@/models/Voyage";
import Vessel from "@/models/Vessel"; // Needed for search filtering if searching by Vessel Name
import { voyageSchema } from "@/lib/validations/voyageSchema";
import { auth } from "@/auth";
import { authorizeRequest } from "@/lib/authorizeRequest";

/* ======================================
   GET: Fetch Voyages (for Table)
====================================== */
export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    
    // 🟢 NEW: Check for vesselId (used by Dropdowns)
    const vesselId = searchParams.get("vesselId");

    // Existing params
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const query: any = {};

    // =========================================================
    // 🟢 MODE A: DROPDOWN FILTERING (Specific Vessel)
    // =========================================================
    if (vesselId) {
      // If the frontend asks for a specific vessel, we return ONLY that vessel's data.
      // We ignore pagination mostly because dropdowns usually need the full list 
      // (or a generous limit) to show history.
      
      query.vesselId = vesselId;

      const voyages = await Voyage.find(query)
        .select("voyageNo status vesselId schedule.startDate") // Select minimal fields
        .sort({ "schedule.startDate": -1 }) // Newest first
        .lean();

      return NextResponse.json(voyages);
    }

    // =========================================================
    // 🔵 MODE B: TABLE LISTING (Standard Search)
    // =========================================================

    // --- Filter by Status ---
    if (status && status !== "all") {
      query.status = status;
    }

    // --- Filter by Date ---
    if (startDate && endDate) {
      query["schedule.eta"] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // --- Search Logic ---
    if (search) {
      const matchingVessels = await Vessel.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");

      const vesselIds = matchingVessels.map((v) => v._id);

      query.$or = [
        { voyageNo: { $regex: search, $options: "i" } },
        { "route.loadPort": { $regex: search, $options: "i" } },
        { vesselId: { $in: vesselIds } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Voyage.find(query)
        .populate("vesselId", "name imo")
        .populate("createdBy", "fullName")
        .populate("updatedBy", "fullName")
        .sort({ "schedule.eta": -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Voyage.countDocuments(query),
    ]);

    return NextResponse.json({
      data,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching voyages:", error);
    return NextResponse.json(
      { error: "Failed to fetch voyages" },
      { status: 500 }
    );
  }
}
/* ======================================
   POST: Create Voyage (for AddForm)
====================================== */
export async function POST(request: Request) {
  try {
    // 1. Authorization
    const authz = await authorizeRequest("voyage.create");
    if (!authz.ok) return authz.response;

    // 2. Get Current User (for Audit)
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentUserId = session.user.id;

    await dbConnect();
    const body = await request.json();

    // 3. Validation (Joi)
    const { error, value } = voyageSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return NextResponse.json(
        { error: "Validation failed", details },
        { status: 400 }
      );
    }

    // 4. Check for Duplicates
    // A vessel cannot have two voyages with the exact same Voyage Number
    const existingVoyage = await Voyage.findOne({
      vesselId: value.vesselId,
      voyageNo: value.voyageNo,
    });

    if (existingVoyage) {
      return NextResponse.json(
        {
          error: `Voyage ${value.voyageNo} already exists for this vessel.`,
          details: [
            { field: "voyageNo", message: "Voyage number must be unique for this vessel" },
          ],
        },
        { status: 409 }
      );
    }

    // 5. Create Voyage with Audit Fields
    // (Ensure your Voyage Model has createdBy/updatedBy fields in Schema)
    const newVoyage = await Voyage.create({
      ...value,
      createdBy: currentUserId,
      updatedBy: currentUserId,
    });

    return NextResponse.json(newVoyage, { status: 201 });
  } catch (error: any) {
    console.error("Error creating voyage:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create voyage" },
      { status: 500 }
    );
  }
}