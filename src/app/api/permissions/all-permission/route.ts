import { dbConnect } from "@/lib/db";
import Permission from "@/models/Permission";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import Resource from "@/models/Resource";
import { authorizeRequest } from "@/lib/authorizeRequest";


export async function GET(req: NextRequest) {
  try {
    const authz = await authorizeRequest("permission.view");
    if (!authz.ok) return authz.response;

    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const resource = searchParams.get("resource");
    const isDropdown = searchParams.get("limit") === "none";

    // 1. Build Query with index-friendly logic
    const query: any = {};
    if (status && status !== "all") query.status = status.toLowerCase();
    
    if (resource && resource !== "all") {
      if (mongoose.Types.ObjectId.isValid(resource)) query.resourceId = resource;
      else query.group = resource;
    }

    // ⚡ Optimization: Only apply $text if search is not empty
    if (search) {
  query.$or = [
    { name: { $regex: search, $options: "i" } },
    { slug: { $regex: search, $options: "i" } },
  ];
}


    // 2. Dropdown Optimization (Instant Fetch)
    if (isDropdown) {
      const data = await Permission.find(query)
        .select("name slug status") 
        .sort({ name: 1 })
        .lean();
      return NextResponse.json(data);
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 20;
    const skip = (page - 1) * limit;

    // 3. ⚡ The "Under 500ms" Execution
    const [permissions, total] = await Promise.all([
      Permission.find(query)
        .select("name slug description status resourceId group createdAt") // Only fields needed
        .populate("resourceId", "name") // Limit populate fields
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(), // lean is 4x faster than standard Mongoose docs
      Permission.countDocuments(query).hint({ createdAt: -1 }) // Force index usage for count
    ]);

    const response = NextResponse.json({
      data: permissions,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    });

    // ⚡ Add Cache-Control for browser speed
    response.headers.set('Cache-Control', 'private, s-maxage=10, stale-while-revalidate=59');
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Fetch Error" }, { status: 500 });
  }
}