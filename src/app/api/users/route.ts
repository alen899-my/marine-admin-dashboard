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

export async function GET(req: NextRequest) {
  try {
    // 1. Authorization & Session Check
    const authz = await authorizeRequest("users.view");
    if (!authz.ok) return authz.response;

    await dbConnect();

    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = session;
    const currentUserId = user.id;
    const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
    const isAdmin = user.role?.toLowerCase() === "admin";
    const userCompanyId = user.company?.id;

    // 2. Parse All Query Params
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;
    
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";
    const companyIdParam = searchParams.get("companyId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // ---------------------------------------------------------
    // 3. BUILD QUERIES (Preserving all original logic)
    // ---------------------------------------------------------

    // --- Permissions Query Logic ---
    const activeResources = await Resource.find({ isDeleted: { $ne: true }, status: "active" }).select("_id");
    const activeResourceIds = activeResources.map(r => r._id);
    const permQuery: any = { resourceId: { $in: activeResourceIds }, status: "active" };
    if (!isSuperAdmin) {
      permQuery.slug = { $in: user.permissions || [] };
    }

    // --- Roles Query Logic ---
    const roleQuery: any = {};
    if (!isSuperAdmin) {
      if (isAdmin) {
        roleQuery.name = { $ne: "super-admin" };
      } else {
        // Non-admins shouldn't see roles list usually, or only their own
        roleQuery._id = null; 
      }
    }

    // --- Users Query Logic (The complex one) ---
    const userQuery: any = {
      status: { $ne: "deleted" },
      deletedAt: null,
      _id: { $ne: currentUserId }
    };

    // Multi-tenancy & Admin restrictions
    if (isSuperAdmin) {
      if (companyIdParam && !["undefined", "null", "all"].includes(companyIdParam)) {
        userQuery.company = companyIdParam;
      }
    } else {
      if (!userCompanyId) {
        return NextResponse.json({ error: "Access denied: No company assigned." }, { status: 403 });
      }
      userQuery.company = userCompanyId;
     // This now runs for EVERYONE who is not a Super Admin
if (!isSuperAdmin) { 
  const superAdminRole = await Role.findOne({ name: /super-admin/i }).select("_id");
  if (superAdminRole) {
    userQuery.role = { $ne: superAdminRole._id }; // Now restricted for all other roles
  }
}
    }

    if (status !== "all") userQuery.status = status;

    // Search (Name, Email, Phone)
    if (search) {
      userQuery.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Date Range
    if (startDate || endDate) {
      const dateRange: any = {};
      if (startDate) dateRange.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateRange.$lte = end;
      }
      userQuery.createdAt = dateRange;
    }

    // --- Companies Query (For Super Admin dropdowns) ---
    const companiesQuery = isSuperAdmin ? {} : { _id: userCompanyId };

    // ---------------------------------------------------------
    // 4. EXECUTE ALL IN PARALLEL
    // ---------------------------------------------------------
    const [permissions, roles, users, totalUsers, companies] = await Promise.all([
      Permission.find(permQuery).populate("resourceId", "name").sort({ slug: 1 }).lean(),
      Role.find(roleQuery).sort({ createdAt: -1 }).lean(),
      User.find(userQuery)
        .select("-password")
        .populate("role", "name")
        .populate({ path: "company", select: "name", strictPopulate: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(userQuery),
      Company.find(companiesQuery).select("name").lean()
    ]);

    // ---------------------------------------------------------
    // 5. RETURN COMBINED RESPONSE
    // ---------------------------------------------------------
    return NextResponse.json({
      users: {
        data: users,
        pagination: {
          total: totalUsers,
          page,
          limit,
          totalPages: Math.ceil(totalUsers / limit),
        },
      },
      roles,
      permissions: permissions.filter(p => p.resourceId !== null),
      companies, // Added so Super Admins can populate company filter dropdowns
      meta: {
        isSuperAdmin,
        isAdmin
      }
    });

  } catch (error: any) {
    console.error("COMBINED GET ERROR →", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch data" },
      { status: 500 }
    );
  }
}