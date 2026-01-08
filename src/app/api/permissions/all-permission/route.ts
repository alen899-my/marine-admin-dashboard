import { dbConnect } from "@/lib/db";
import Permission from "@/models/Permission";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import Resource from "@/models/Resource";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const _ensureModels = [Resource];
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const resource = searchParams.get("resource") || "";
    
    // 💡 Check if we want a full list for a dropdown (no pagination)
    const isDropdown = searchParams.get("limit") === "none";

    // 1. Build the Query Object
    let query: any = {};

    // Filter by Status
    if (status !== "all") {
      query.status = status.toLowerCase();
    }

    // Filter by Resource (Handles both ObjectId and legacy string groups)
    if (resource && resource !== "all") {
      if (mongoose.Types.ObjectId.isValid(resource)) {
        query.resourceId = resource;
      } else {
        // If it's a name/string, search the legacy 'group' field
        query.group = resource;
      }
    }

    // Search by Name or Slug
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } }
      ];
    }

    // 💡 Logic for Dropdowns (No Pagination)
    if (isDropdown) {
      const permissions = await Permission.find(query)
        .sort({ name: 1 })
        .select("name slug status") // Minimal fields for speed
        .lean();
      return NextResponse.json(permissions);
    }

    // 💡 Logic for Table (With Pagination)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Use Promise.all to run Find and Count in parallel for performance
    const [permissions, total] = await Promise.all([
      Permission.find(query)
        .populate("resourceId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Permission.countDocuments(query),
    ]);

    // 💡 Ghost Page Prevention: 
    // Calculate total pages and ensure it's at least 1 even if total is 0
    const calculatedTotalPages = Math.ceil(total / limit);
    const totalPages = calculatedTotalPages === 0 ? 1 : calculatedTotalPages;

    return NextResponse.json({
      data: permissions,
      pagination: {
        total,
        page,
        limit,
        totalPages: totalPages,
      },
    });
  } catch (error: any) {
    console.error("GET PERMISSIONS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions", details: error.message },
      { status: 500 }
    );
  }
}