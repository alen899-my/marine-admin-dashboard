import { dbConnect } from "@/lib/db";
import Role from "@/models/Role";

interface GetRolesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  user: any;
}

export async function getRoles({
  page = 1,
  limit = 20,
  search = "",
  status = "all",
  user,
}: GetRolesParams) {
  await dbConnect();

  const userRoleName = user.role?.toLowerCase();
  const skip = (page - 1) * limit;

  // 1. Build Query
  const query: any = {};

  // RBAC Filtering
  if (userRoleName === "admin") {
    query.name = { $nin: ["super-admin", "admin"] };
  } else if (userRoleName !== "super-admin") {
    // Non-admins see nothing (or handle differently based on your needs)
    return { 
      data: [], 
      pagination: { total: 0, page, limit, totalPages: 0 } 
    };
  }

  // 2. Search Filter
  if (search.trim()) {
    query.name = { $regex: search.trim(), $options: "i" };
  }

  // 3. Status Filter
  if (status && status !== "all") {
    query.status = status.toLowerCase();
  }

  // 4. Execute Query
  const [data, total] = await Promise.all([
    Role.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Role.countDocuments(query),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

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