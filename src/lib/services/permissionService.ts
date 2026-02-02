import { dbConnect } from "@/lib/db";
import Permission from "@/models/Permission";
import Resource from "@/models/Resource";
import mongoose from "mongoose";

interface GetPermissionsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  module?: string;
  user: any;
}

export async function getPermissions({
  page = 1,
  limit = 20,
  search = "",
  status = "all",
  module,
  user,
}: GetPermissionsParams) {
  await dbConnect();



  const userRole = user.role;
  const userPermissions = user.permissions || [];
  const skip = (page - 1) * limit;

  // 1. Get Active Resources
  const activeResources = await Resource.find({
    isDeleted: { $ne: true },
    status: "active",
  })
    .select("name _id")
    .sort({ name: 1 })
    .lean();

  const activeResourceIds = activeResources.map((r) => r._id);

  // 2. Build Base Query
  // ✅ FIX: Use $or to allow permissions that belong to Active Resources OR have No Resource (Global)
  // If we don't do this, Global permissions or permissions for deleted resources disappear.
  const query: any = {
    $or: [
      { resourceId: { $in: activeResourceIds } },
      { resourceId: null },
      { resourceId: { $exists: false } },
    ]
  };

  // 3. Status Filter
 if (status && status !== "all") {
  query.status = status.toLowerCase();
}


  
  // 4. Module/Resource Filter
  if (module && module !== "all") {
    // If a specific module is selected, we override the base $or check
    // to focus ONLY on that module.
    if (mongoose.Types.ObjectId.isValid(module)) {
      query.resourceId = module;
      delete query.$or; // Remove the "Global/Active" check to focus on specific ID
    } else {
      query.group = module;
      delete query.$or;
    }
  }

  // 5. Search Filter
  if (search.trim()) {
    const searchRegex = { $regex: search.trim(), $options: "i" };
    const searchQuery = {
      $or: [
        { name: searchRegex },
        { slug: searchRegex },
      ],
    };

    // Combine safely with existing $or if it exists
    if (query.$or) {
      query.$and = [{ $or: query.$or }, searchQuery];
      delete query.$or;
    } else {
      Object.assign(query, searchQuery);
    }
  }

  // RBAC Check
  if (userRole !== "super-admin") {
    // Ensure we don't overwrite existing query logic, just append this restriction
    const rbacQuery = { slug: { $in: userPermissions } };
    if (query.$and) {
      query.$and.push(rbacQuery);
    } else {
      Object.assign(query, rbacQuery);
    }
  }



  // 6. Execute
  const [data, total] = await Promise.all([
    Permission.find(query)
      .select("name slug description status resourceId group createdAt")
      .populate("resourceId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Permission.countDocuments(query),
  ]);

 

  return {
    data: JSON.parse(JSON.stringify(data)),
    resources: JSON.parse(JSON.stringify(activeResources)),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}