import { dbConnect } from "@/lib/db";
import Role from "@/models/Role";
import { roleSchema } from "@/lib/validations/roleSchema";
import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
import ReportOperational from "@/models/ReportOperational";
// GET ALL ROLES (With Pagination & Search)
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";

    // Build Query
    const query: any = {};

    if (search) {
      query.name = { $regex: search, $options: "i" }; // Case-insensitive search
    }

    if (status !== "all") {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [roles, total] = await Promise.all([
      Role.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Role.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: roles,
      pagination: {
        total,
        page,
        totalPages,
        limit,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

// CREATE NEW ROLE
export async function POST(req: NextRequest) {
  try {
        const authz = await authorizeRequest("roles.create");
        if (!authz.ok) return authz.response;
    await dbConnect();
    const body = await req.json();

    // 1. Joi Validation (Format Check)
    const { error, value } = roleSchema.validate(body, { abortEarly: false });
    if (error) {
      return NextResponse.json(
        { error: "Validation failed", details: error.details.map((x) => x.message) },
        { status: 400 }
      );
    }

    // 2. Case-Insensitive Uniqueness Check (Database Check)
    // ^ and $ ensure exact match, 'i' flag makes it case-insensitive
    const existingRole = await Role.findOne({ 
      name: { $regex: new RegExp(`^${value.name}$`, "i") } 
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "A role with this name already exists." }, 
        { status: 409 } // 409 Conflict
      );
    }

    // 3. Create Role
    const newRole = await Role.create(value);

    return NextResponse.json(
      { success: true, message: "Role created successfully", role: newRole },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("CREATE ROLE ERROR:", error);
    // Handle duplicate key error from MongoDB index just in case
    if (error.code === 11000) {
      return NextResponse.json({ error: "Role name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
  }
}