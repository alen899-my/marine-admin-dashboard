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
    const userRole = authz.session?.user?.role;
    const userPermissions = authz.session?.user?.permissions || [];

    await dbConnect();

    // 🟢 2. Identify ACTIVE and NON-DELETED Resources
    // We fetch this first to ensure our permissions query is restricted to "visible" resources
    const activeResources = await Resource.find({ 
      isDeleted: { $ne: true }, 
      status: "active" 
    })
      .select("name _id")
      .sort({ name: 1 })
      .lean();
    
    const activeResourceIds = activeResources.map(r => r._id);

    // 3. Parse Query Parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const resource = searchParams.get("resource");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 20;
    const skip = (page - 1) * limit;

    // 🟢 4. Build Permission Query
    // Start with the base rule: Only show permissions belonging to active/non-deleted resources
    const query: any = {
      resourceId: { $in: activeResourceIds }
    };

   if (userRole !== "super-admin") {
      query.slug = { $in: userPermissions };
    }

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

    // 5. Parallel Execution
    const [permissions, total] = await Promise.all([
      // Fetch Permissions matching our query
      Permission.find(query)
        .select("name slug description status resourceId group createdAt")
        .populate("resourceId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      // Accurate count based on the filtered query
      Permission.countDocuments(query)
    ]);
    let finalResources = activeResources;
    if (userRole !== "super-admin") {
      const allowedResourceIds = permissions.map(p => p.resourceId?._id?.toString());
      finalResources = activeResources.filter(r => 
        allowedResourceIds.includes(r._id.toString())
      );
    }

    // 6. Construct response
    const response = NextResponse.json({
      data: permissions,
      resources: activeResources, // Already fetched at the top
      pagination: { 
        total, 
        page, 
        limit, 
        totalPages: Math.ceil(total / limit) || 1 
      },
    });

    // 7. Performance Headers
    response.headers.set('Cache-Control', 'private, s-maxage=10, stale-while-revalidate=59');
    
    return response;
  } catch (error) {
    console.error("PERMISSION_GET_ERROR:", error);
    return NextResponse.json({ error: "Fetch Error" }, { status: 500 });
  }
}