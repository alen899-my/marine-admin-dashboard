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

  let query: any = { isDeleted: { $ne: true } };

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
    // 1. Check Authorization
    const authz = await authorizeRequest("resource.create");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const body = await req.json();

    // 2. Joi Validation
    const { error, value } = resourceSchema.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message }, 
        { status: 400 }
      );
    }

    // 3. Strict Duplicate Check (Case-Insensitive)
    const existingResource = await Resource.findOne({ 
      name: { $regex: new RegExp(`^${value.name}$`, "i") } ,isDeleted: { $ne: true }
    });

    if (existingResource) {
      return NextResponse.json(
        { error: "A resource with this name already exists" },
        { status: 409 } 
      );
    }

    // 4. Save to Database
    const newResource = await Resource.create(value);
    
    return NextResponse.json({
      success: true,
      data: newResource
    }, { status: 201 });

  } catch (error: any) {
    console.error("POST RESOURCE ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" }, 
      { status: 500 }
    );
  }
}