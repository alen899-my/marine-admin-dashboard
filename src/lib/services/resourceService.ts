import { dbConnect } from "@/lib/db";
import Resource from "@/models/Resource";
import Permission from "@/models/Permission";

interface GetResourcesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  user: any;
}

export async function getResources({
  page = 1,
  limit = 20,
  search = "",
  status = "all",
  user,
}: GetResourcesParams) {
  await dbConnect();

  const userRole = user.role;
  const userPermissions = user.permissions || [];
  const skip = (page - 1) * limit;

  // 1. Build Query
  let query: any = { deletedAt: null };

  // 2. RBAC Logic (Copied from previous API)
  if (userRole !== "super-admin") {
    // Find all Permission documents that match the slugs in the user's session
    const allowedPerms = await Permission.find({
      slug: { $in: userPermissions },
    }).select("resourceId");

    // Extract unique Resource IDs
    const allowedResourceIds = allowedPerms
      .map((p) => p.resourceId)
      .filter((id) => id != null);

    // Only show resources the user has permissions for
    query._id = { $in: allowedResourceIds };
  }

  // 3. Search Filter
  if (search.trim()) {
    query.name = { $regex: search.trim(), $options: "i" };
  }

  // 4. Status Filter
  if (status && status !== "all") {
    query.status = status.toLowerCase();
  }

  // 5. Execute Query
  const [data, total] = await Promise.all([
    Resource.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("name status createdAt") // Select necessary fields
      .lean(),
    Resource.countDocuments(query),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // 6. Serialize & Return
  return {
    data: JSON.parse(JSON.stringify(data)),
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}