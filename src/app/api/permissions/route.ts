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

    const userRole = authz.session?.user?.role;
    const userPermissions = authz.session?.user?.permissions || [];
    await dbConnect();

    // 🟢 1. Get IDs of resources that are both Active and NOT Deleted
    const activeResources = await Resource.find({ 
      isDeleted: { $ne: true }, 
      status: "active" 
    }).select("_id");
    
    const activeResourceIds = activeResources.map(r => r._id);

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode"); 
    const fetchAll = searchParams.get("all") === "true";

    // 🟢 2. Filter Permissions by these valid Resource IDs
    const query: any = { 
      resourceId: { $in: activeResourceIds } 
    };

if (userRole !== "super-admin") {
      query.slug = { $in: userPermissions };
    }

    if (!fetchAll) {
      query.status = "active";
    }

    const permissions = await Permission.find(query)
      .populate("resourceId", "name")
      .sort({ slug: 1 })
      .lean();

    // 🟢 3. Double-check for null resourceId (Safety layer)
    const validPermissions = permissions.filter(p => p.resourceId !== null);

    // Grouping logic remains the same
    if (mode === "grouped") {
      const grouped = validPermissions.reduce((acc: any, curr: any) => {
        const key = curr.resourceId?.name || curr.group || "General";
        if (!acc[key]) acc[key] = [];
        acc[key].push(curr);
        return acc;
      }, {});
      return NextResponse.json(grouped);
    }

    return NextResponse.json(validPermissions);
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