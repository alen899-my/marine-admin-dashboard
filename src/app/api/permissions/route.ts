import { dbConnect } from "@/lib/db";
import Permission from "@/models/Permission";
import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
import Resource from "@/models/Resource";
import Role from "@/models/Role"
export async function GET(req: NextRequest) {
  try {
    const authz = await authorizeRequest("permission.view");
    if (!authz.ok) return authz.response;
    await dbConnect();
    const _ensureModels = [Resource];
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode"); 
    const fetchAll = searchParams.get("all") === "true";

    const query = fetchAll ? {} : { status: "active" };

    // 🟢 CHANGE: Added .populate() to get the Resource name
    const permissions = await Permission.find(query)
      .populate("resourceId", "name") // Fetch only 'name' from the Resource model
      .sort({ slug: 1 }).lean();

    if (mode === "grouped") {
      const grouped = permissions.reduce((acc: any, curr: any) => {
        // Use the populated name if available, else group name, else General
        const key = curr.resourceId?.name || curr.group || "General";
        if (!acc[key]) acc[key] = [];
        acc[key].push(curr);
        return acc;
      }, {});
      return NextResponse.json(grouped);
    }

    return NextResponse.json(permissions);
  } catch (error) {
    console.error("GET PERMISSIONS ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  try {
    const authz = await authorizeRequest("permission.create");
    if (!authz.ok) return authz.response;

    await dbConnect();
    const body = await req.json();
    const permissionsToSeed = Array.isArray(body) ? body : [body];

    // 1. Filter valid slugs
    const validPermissions = permissionsToSeed.filter(p => p.slug && p.slug.trim() !== "");
    if (validPermissions.length === 0) {
      return NextResponse.json({ error: "No valid permissions provided" }, { status: 400 });
    }

    // 2. Check for existing slugs in DB
    const incomingSlugs = validPermissions.map(p => p.slug);
    const existing = await Permission.find({ slug: { $in: incomingSlugs } }).select('slug');

    if (existing.length > 0) {
      const duplicateList = existing.map(e => e.slug).join(", ");
      return NextResponse.json({ 
        error: `Permission(s) already exist: ${duplicateList}` 
      }, { status: 409 }); 
    }

    const operations = validPermissions.map((perm) => ({
      insertOne: {
        document: { 
          slug: perm.slug,
          name: perm.name,
          description: perm.description, 
          resourceId: perm.resourceId,
          status: perm.status || "active" 
        }
      },
    }));

    // Execute Bulk Write to create Permissions
    const result = await Permission.bulkWrite(operations, { ordered: false });

    // 🟢 3. AUTOMATICALLY ASSIGN SLUGS TO SUPER ADMIN
    if (result.insertedCount > 0) {
      await Role.findOneAndUpdate(
        { name: "super-admin" }, 
        { 
          // ✅ Use $each with incomingSlugs (the strings), NOT IDs
          $addToSet: { permissions: { $each: incomingSlugs } } 
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${result.insertedCount} New permissions added and assigned to super-admin.`,
    }, { status: 201 });

  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Duplicate slug detected." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}