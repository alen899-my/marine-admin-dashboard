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
    const authz = await authorizeRequest("voyage.view");
    if (!authz.ok) return authz.response;
    await dbConnect();

    // 🔒 1. Session & Multi-Tenancy Setup
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = session;
    const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
    const userCompanyId = user.company?.id;

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
    // 🔒 MULTI-TENANCY FILTERING LOGIC
    // =========================================================
    if (!isSuperAdmin) {
      if (!userCompanyId) {
        return NextResponse.json(
          { error: "Access denied: No company assigned to your profile." },
          { status: 403 }
        );
      }

      // Step A: Find all vessels belonging to the user's company
      const companyVessels = await Vessel.find({ company: userCompanyId }).select("_id");
      const companyVesselIds = companyVessels.map((v) => v._id);

      // Step B: Restrict the query to only these vessels
      query.vesselId = { $in: companyVesselIds };

      // Step C: If a specific vesselId was requested, ensure it belongs to the user's company
      if (vesselId) {
        if (companyVesselIds.some((id) => id.toString() === vesselId)) {
          query.vesselId = vesselId;
        } else {
          // If trying to access a vessel outside their company, return empty or error
          return NextResponse.json([], { status: 200 }); 
        }
      }
    } else {
      // Super Admin: Use the vesselId param directly if provided
      if (vesselId) {
        query.vesselId = vesselId;
      }
    }
    // =========================================================

    // =========================================================
    // 🟢 MODE A: DROPDOWN FILTERING (Specific Vessel)
    // =========================================================
    if (vesselId) {
     
      
      const voyages = await Voyage.find(query)
        .select("voyageNo status vesselId schedule.startDate") // Select minimal fields
        .sort({ "schedule.startDate": -1 }) // Newest first
        .lean();

      return NextResponse.json(voyages);
    }

    
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
      const vesselSearchQuery: any = {
        name: { $regex: search, $options: "i" },
      };

      // 🔒 Ensure vessel search is also restricted by company for non-admins
      if (!isSuperAdmin) {
        vesselSearchQuery.company = userCompanyId;
      }

      const matchingVessels = await Vessel.find(vesselSearchQuery).select("_id");
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
       .sort({ createdAt: -1 })
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
  }  catch (error: any) {
  console.error("Error creating voyage:", error);

  // ✅ Handle MongoDB duplicate key error
  if (error?.code === 11000) {
    return NextResponse.json(
      {
        error: "Duplicate voyage",
        details: [
          {
            field: "voyageNo",
            message: "Voyage number already exists for this vessel",
          },
        ],
      },
      { status: 409 }
    );
  }

  return NextResponse.json(
    { error: error.message || "Failed to create voyage" },
    { status: 500 }
  );
}

}