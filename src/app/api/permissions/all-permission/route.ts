import { dbConnect } from "@/lib/db";
import Permission from "@/models/Permission";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import Resource from "@/models/Resource";
import { authorizeRequest } from "@/lib/authorizeRequest";


export async function GET(req: NextRequest) {
  try {
    // 1. Authorization Check
    const authz = await authorizeRequest("permission.view");
    if (!authz.ok) return authz.response;

    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const resource = searchParams.get("resource");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 20;
    const skip = (page - 1) * limit;

    // 2. Build Permission Query
    const query: any = {};
    if (status && status !== "all") query.status = status.toLowerCase();
    
    if (resource && resource !== "all") {
      if (mongoose.Types.ObjectId.isValid(resource)) {
        query.resourceId = resource;
      } else {
        query.group = resource;
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

   
    const [permissions, total, resourceDropdown] = await Promise.all([
     
      Permission.find(query)
        .select("name slug description status resourceId group createdAt")
        .populate("resourceId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

     
      Permission.countDocuments(query).hint({ createdAt: -1 }),

      
      Resource.find({ isDeleted: { $ne: true }, status: "active" })
        .select("name _id")
        .sort({ name: 1 })
        .lean()
    ]);

    // 4. Construct response with both data sets
    const response = NextResponse.json({
      data: permissions,
      resources: resourceDropdown, // Integrated resource data
      pagination: { 
        total, 
        page, 
        limit, 
        totalPages: Math.ceil(total / limit) || 1 
      },
    });

    // 5. Performance Headers
    response.headers.set('Cache-Control', 'private, s-maxage=10, stale-while-revalidate=59');
    
    return response;
  } catch (error) {
    console.error("PERMISSION_GET_ERROR:", error);
    return NextResponse.json({ error: "Fetch Error" }, { status: 500 });
  }
}