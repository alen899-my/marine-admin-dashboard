import { auth } from "@/auth";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";
import Role from "@/models/Role";
import User from "@/models/User";
import { put } from "@vercel/blob";
import bcrypt from "bcryptjs";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import Permission from "@/models/Permission"; 
import Resource from "@/models/Resource";
export async function POST(req: NextRequest) {
  try {
    // 1. Authorization
    const authz = await authorizeRequest("users.create");
    if (!authz.ok) return authz.response;

    await dbConnect();

    // 2. Parse FormData (Required for file uploads)
    const formData = await req.formData();

    // Extract Text Fields
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;
    const company = formData.get("company") as string;
    let role = formData.get("role") as string;

    // Handle Permissions (expecting JSON strings for arrays)
    const additionalPermissionsRaw = formData.get(
      "additionalPermissions"
    ) as string;
    const excludedPermissionsRaw = formData.get(
      "excludedPermissions"
    ) as string;

    let additionalPermissions: string[] = [];
    let excludedPermissions: string[] = [];

    try {
      if (additionalPermissionsRaw)
        additionalPermissions = JSON.parse(additionalPermissionsRaw);
      if (excludedPermissionsRaw)
        excludedPermissions = JSON.parse(excludedPermissionsRaw);
    } catch (e) {
      console.warn("Failed to parse permissions JSON", e);
    }

    // 3. Handle Profile Picture Upload
    const file = formData.get("profilePicture") as File | null;
    let profilePictureUrl = ""; // Default to empty/null

    if (file && file.size > 0) {
      // Validation: 2MB Limit (Adjust as needed)
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Profile picture exceeds the 2MB limit." },
          { status: 400 }
        );
      }

      const filename = `user_${Date.now()}_${file.name.replace(/\s/g, "_")}`;

      // --- CONDITIONAL UPLOAD LOGIC ---
      if (process.env.NODE_ENV === "development") {
        // --- LOCAL STORAGE (Development) ---
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = path.join(process.cwd(), "public/uploads/users");

        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        await writeFile(path.join(uploadDir, filename), buffer);
        profilePictureUrl = `/uploads/users/${filename}`;
      } else {
        // --- VERCEL BLOB (Production) ---
        const blob = await put(filename, file, {
          access: "public",
          addRandomSuffix: true,
        });
        profilePictureUrl = blob.url;
      }
    }

    // 4. Role Fallback Logic
    if (!role) {
      const defaultRole = await Role.findOne({
        $or: [{ name: "op-staff" }, { slug: "op-staff" }],
      });

      if (defaultRole) {
        role = defaultRole._id.toString();
      } else {
        return NextResponse.json(
          { error: "Default 'op-staff' role not found. Please select a role." },
          { status: 400 }
        );
      }
    }

    // 5. Basic Validations
    if (!name || !email || !password || !company) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, or password" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const validCompany = await Company.findById(company);
    if (!validCompany) {
      return NextResponse.json(
        { error: "Invalid Company ID" },
        { status: 400 }
      );
    }

    const validRole = await Role.findById(role);
    if (!validRole) {
      return NextResponse.json(
        { error: "Invalid Role ID provided" },
        { status: 400 }
      );
    }

    // 6. Create User
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName: name,
      email: email,
      phone: phone,
      password: hashedPassword,
      company: company,
      role: role,
      additionalPermissions: additionalPermissions,
      excludedPermissions: excludedPermissions,
      profilePicture: profilePictureUrl || null, // ✅ Save the URL
      status: "active",
    });

    await Company.findByIdAndUpdate(company, {
      $addToSet: { users: newUser._id },
    });

    return NextResponse.json(
      { success: true, userId: newUser._id, roleId: newUser.role },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("CREATE USER ERROR →", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ... GET function (Keep your existing GET function here)
export async function GET(req: NextRequest) {
  try {
    const authz = await authorizeRequest("users.view");
    if (!authz.ok) return authz.response;
     const { searchParams } = new URL(req.url);
    const fetchType = searchParams.get("type") || "users";

    await dbConnect();

    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = session;
    const currentUserId = user.id;
    // Check if user is Super Admin (adjust string to match your DB exactly, e.g., 'super-admin')
    const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
    const isAdmin = user.role?.toLowerCase() === "admin";
    const userCompanyId = user.company?.id;

  

    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all"; // renamed to avoid conflict
    const companyIdParam = searchParams.get("companyId");

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;
    // 🔴 ---------------------------------------------------------
    // 🔴 LOGIC FOR PERMISSIONS
    // 🔴 ---------------------------------------------------------
    if (fetchType === "permissions") {
      const mode = searchParams.get("mode"); 
      const fetchAll = searchParams.get("all") === "true";
      const userPermissions = session.user.permissions || [];

      // Get Active Resources
      const activeResources = await Resource.find({ 
        isDeleted: { $ne: true }, 
        status: "active" 
      }).select("_id");
      const activeResourceIds = activeResources.map(r => r._id);

      const permQuery: any = { resourceId: { $in: activeResourceIds } };
      
      if (!isSuperAdmin) {
        permQuery.slug = { $in: userPermissions };
      }
      if (!fetchAll) {
        permQuery.status = "active";
      }

      const permissions = await Permission.find(permQuery)
        .populate("resourceId", "name")
        .sort({ slug: 1 })
        .lean();

      const validPermissions = permissions.filter(p => p.resourceId !== null);

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
    }

    // 🔴 ---------------------------------------------------------
    // 🔴 LOGIC FOR ROLES (with filtration)
    // 🔴 ---------------------------------------------------------
    if (fetchType === "roles") {
      const roleQuery: any = {};
      
      // Role Visibility Logic
      if (isSuperAdmin) {
        // No restrictions
      } else if (isAdmin) {
      roleQuery.name = { $ne: "super-admin" };
      } else {
        return NextResponse.json({ data: [], pagination: { total: 0, page, totalPages: 0, limit }});
      }

      if (search) roleQuery.name = { $regex: search, $options: "i" };
      if (status !== "all") roleQuery.status = status;

      const [roles, totalRoles] = await Promise.all([
        Role.find(roleQuery).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Role.countDocuments(roleQuery),
      ]);

      return NextResponse.json({
        data: roles,
        pagination: { total: totalRoles, page, limit, totalPages: Math.ceil(totalRoles / limit) },
      });
    }

    // 1. Initialize query with Soft Delete Filter
    // This ensures we only see users who are NOT deleted and don't have a deleted timestamp
    const query: any = {
      status: { $ne: "deleted" },
      deletedAt: null 
    };
    query._id = { $ne: currentUserId };

    // =========================================================
    // 🔒 MULTI-TENANCY FILTERING LOGIC
    // =========================================================
    if (isSuperAdmin) {
      if (
        companyIdParam &&
        companyIdParam !== "undefined" &&
        companyIdParam !== "null" &&
        companyIdParam !== "all"
      ) {
        query.company = companyIdParam;
      }
    } else {
      if (!userCompanyId) {
        return NextResponse.json(
          { error: "Access denied: No company assigned to your profile." },
          { status: 403 }
        );
      }
      query.company = userCompanyId;
      if (isAdmin) {
        // 1. Find the Super Admin Role object to get its ID
        const superAdminRole = await Role.findOne({ name: /super-admin/i }).select("_id");
        if (superAdminRole) {
          // 2. Filter users where role is NOT the Super Admin role ID
          query.role = { $ne: superAdminRole._id };
        }
      }
    }

    // 2. Handle Status filter from Params
    // If the user selects a specific status, it overrides the default "not deleted"
    // but we still want to ensure they don't see soft-deleted records.
    if (status !== "all") {
      query.status = status;
    }

    // 3. Search Logic
    if (search) {
      query.$and = [
        {
          $or: [
            { fullName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
          ],
        },
      ];
    }

    // 4. Date range logic
    if (startDate || endDate) {
      const dateQuery: any = {};
      if (startDate) dateQuery.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.$lte = end;
      }
      if (Object.keys(dateQuery).length > 0) query.createdAt = dateQuery;
    }

    // 5. Fetch Data
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password")
      .populate("role", "name")
      .populate({
        path: "company",
        select: "name",
        strictPopulate: false,
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET USERS ERROR →", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}