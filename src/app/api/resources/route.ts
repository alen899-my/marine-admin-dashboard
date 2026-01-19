import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Resource from "@/models/Resource";
import { resourceSchema } from "@/lib/validations/resourceSchema";
import { authorizeRequest } from "@/lib/authorizeRequest";

/* ======================================================
   GET: Fetch All Resources
====================================================== */
export async function GET(req: NextRequest) {
  try {
    const authz = await authorizeRequest("resource.view");
    if (!authz.ok) return authz.response;
    
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    
    // Check if we want a full list for a dropdown
    const isDropdown = searchParams.get("limit") === "none";

 let query: any = { deletedAt: null };

if (search.trim()) {
  query.name = { $regex: search.trim(), $options: "i" };
}

if (status !== "all") {
  query.status = status.toLowerCase();
}

    // 💡 Logic for Dropdowns (No Pagination)
    if (isDropdown) {
      const resources = await Resource.find(query)
        .sort({ name: 1 })
        .select("name status"); // Faster because it only pulls 2 fields
      return NextResponse.json(resources);
    }

    // 💡 Logic for Table (With Pagination)
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [resources, total] = await Promise.all([
      Resource.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("name status ")
        .lean(),
      Resource.countDocuments(query),
    ]);
const totalPages = Math.max(1, Math.ceil(total / limit));
    return NextResponse.json({
      data: resources,
      pagination: {
        total,
        page,
        limit,
           totalPages,
      },
    });
  } catch (error: any) {
    console.error("GET ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

/* ======================================================
   POST: Create New Resource
====================================================== */
export async function POST(req: NextRequest) {
  try {
    const authz = await authorizeRequest("resource.create");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const body = await req.json();

    const { error, value } = resourceSchema.validate(body);
    if (error) return NextResponse.json({ error: error.details[0].message }, { status: 400 });

    const nameRegex = new RegExp(`^${value.name}$`, "i");

    // 🟢 1. Check for an ACTIVE resource
    const activeResource = await Resource.findOne({ 
      name: nameRegex, 
      deletedAt: null 
    });
    if (activeResource) {
      return NextResponse.json({ error: "A resource with this name already exists" }, { status: 409 });
    }

    // 🟢 2. Check for a DELETED resource with this name to RESTORE
    const deletedResource = await Resource.findOne({ 
      name: nameRegex, 
      deletedAt: { $ne: null } 
    });

    if (deletedResource) {
      // Restore the existing record instead of creating a new one
      const restoredResource = await Resource.findByIdAndUpdate(
        deletedResource._id,
        { 
          ...value, 
        
          deletedAt: null, 
          status: "active" 
        },
        { new: true }
      );

      return NextResponse.json({
        success: true,
        message: "Existing resource restored from trash",
        data: restoredResource
      }, { status: 200 }); // 200 OK since it's an update of a deleted item
    }

    // 🟢 3. No match found at all? Create fresh.
   const newResource = await Resource.create({ 
      ...value, 
      deletedAt: null 
    });
    
    return NextResponse.json({
      success: true,
      data: newResource
    }, { status: 201 });

  } catch (error: any) {
    console.error("POST RESOURCE ERROR:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}