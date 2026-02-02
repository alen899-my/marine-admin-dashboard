import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";
import Permission from "@/models/Permission";
import Resource from "@/models/Resource";
import Role from "@/models/Role";
import User from "@/models/User";

interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  companyId?: string;
  startDate?: string;
  endDate?: string;
  user: any; // Session User
}

export async function getUsers({
  page = 1,
  limit = 20,
  search,
  status,
  companyId,
  startDate,
  endDate,
  user,
}: GetUsersParams) {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = user.company?.id || user.company;
  const currentUserId = user.id;
  const skip = (page - 1) * limit;

  // Initial Query: Exclude soft-deleted users and self
  const query: any = {
    deletedAt: null,
    _id: { $ne: currentUserId },
  };

  // --- 1. Multi-Tenancy & Role Restriction Logic ---
  if (isSuperAdmin) {
    if (companyId && companyId !== "all") {
      query.company = companyId;
    }
  } else {
    // Restricted user: Force company ID
    if (!userCompanyId) throw new Error("No company assigned");
    query.company = userCompanyId;

    // 🔒 SECURITY: Prevent non-Super Admins from seeing Super Admin users
    const superAdminRole = await Role.findOne({ name: "super-admin" }).select(
      "_id",
    );
    if (superAdminRole) {
      query.role = { $ne: superAdminRole._id };
    }
  }

  // --- 2. Filters ---
  if (status && status !== "all") query.status = status;

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  if (startDate && endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: end,
    };
  }

  // --- 3. Execute Query ---
  const [total, users] = await Promise.all([
    User.countDocuments(query),
    User.find(query)
      .populate("role", "name permissions")
      .populate("company", "name")
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const serializedUsers = JSON.parse(JSON.stringify(users));

  return {
    data: serializedUsers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Fetch Metadata (Roles, Permissions, Companies)
export async function getUserMetadata(user: any) {
  await dbConnect();
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const isAdmin = user.role?.toLowerCase() === "admin";

  // 1. Role Query: Hide 'super-admin' role from non-super-admins
  const roleQuery: any = { deletedAt: null };
  if (!isSuperAdmin) {
    roleQuery.name = { $ne: "super-admin" };
    if (!isAdmin) {
      // If regular user (not admin), maybe hide all roles or specific ones?
      // Defaulting to showing available roles for their level
    }
  }

  // 2. Permission Query: Only show permissions the current user has access to (if not super admin)
  const permQuery: any = { status: "active" };

  // Ensure we only fetch permissions for active resources
  const activeResources = await Resource.find({
    status: "active",
    isDeleted: { $ne: true },
  }).select("_id");
  const activeResourceIds = activeResources.map((r) => r._id);
  permQuery.resourceId = { $in: activeResourceIds };

  if (!isSuperAdmin) {
    permQuery.slug = { $in: user.permissions || [] };
  }

  const [roles, permissions, companiesRaw] = await Promise.all([
    Role.find(roleQuery).sort({ createdAt: -1 }).lean(),
    Permission.find(permQuery)
      .populate("resourceId", "name")
      .sort({ slug: 1 })
      .lean(),
    isSuperAdmin
      ? Company.find({ status: "active", deletedAt: null })
          .select("_id name")
          .lean()
      : Promise.resolve([]),
  ]);

  const companies = (companiesRaw as any[]).map((c) => ({
    value: c._id.toString(),
    label: c.name,
  }));

  return {
    roles: JSON.parse(JSON.stringify(roles)),
    permissions: JSON.parse(JSON.stringify(permissions)),
    companies: JSON.parse(JSON.stringify(companies)),
  };
}
