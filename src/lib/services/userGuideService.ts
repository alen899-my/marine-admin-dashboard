import { dbConnect } from "@/lib/db";
import Permission from "@/models/Permission";
import Resource from "@/models/Resource";
import Role from "@/models/Role";
import UserGuide from "@/models/UserGuide";
import UserGuideGroup from "@/models/UserGuideGroup";

interface GetUserGuidesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  group?: string;
}

const USER_GUIDE_PERMISSION_DEFINITIONS = [
  {
    slug: "userguide.create",
    name: "Create User Guide",
    description: "allow users to create user guide",
  },
  {
    slug: "userguide.view",
    name: "View User Guide",
    description: "allow users to view user guide",
  },
  {
    slug: "userguide.edit",
    name: "Edit User Guide",
    description: "allow users to edit user guide",
  },
  {
    slug: "userguide.delete",
    name: "Delete User Guide",
    description: "allow users to delete user guide",
  },
];

export async function ensureUserGuideSetup() {
  await dbConnect();

  const resource = await Resource.findOneAndUpdate(
    { name: { $regex: /^User Guide$/i } },
    {
      $set: {
        name: "User Guide",
        status: "active",
        deletedAt: null,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  await Permission.bulkWrite(
    USER_GUIDE_PERMISSION_DEFINITIONS.map((permission) => ({
      updateOne: {
        filter: { slug: permission.slug },
        update: {
          $set: {
            ...permission,
            resourceId: resource._id,
            status: "active",
          },
        },
        upsert: true,
      },
    })),
  );
}

import mongoose from "mongoose";

interface SerializableUserGuide {
  _id: { toString: () => string };
  groupId:
    | {
        _id?: { toString: () => string };
        toString?: () => string;
        name?: string;
        sortOrder?: number;
      }
    | string
    | null
    | undefined;
  title?: string;
  content?: string;
  roleContents?: Map<string, string> | Record<string, unknown>;
  assignedRoles?: (mongoose.Types.ObjectId | string)[];
  sortOrder?: number;
  status?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

function serializeGuide(guide: SerializableUserGuide) {
  const roleContents =
    guide.roleContents instanceof Map
      ? Object.fromEntries(guide.roleContents.entries())
      : Object.fromEntries(
          Object.entries(guide.roleContents || {}).map(([role, content]) => [
            role,
            String(content || ""),
          ]),
        );

  const groupIdObj = guide.groupId;
  const groupIdStr = typeof groupIdObj === 'object' && groupIdObj !== null
    ? (groupIdObj._id?.toString() ?? groupIdObj.toString?.() ?? "")
    : (groupIdObj?.toString?.() ?? "");

  const groupName = typeof groupIdObj === 'object' && groupIdObj !== null
    ? groupIdObj.name
    : undefined;
  const groupSortOrder = typeof groupIdObj === 'object' && groupIdObj !== null
    ? groupIdObj.sortOrder
    : undefined;

  return {
    _id: guide._id.toString(),
    groupId: groupIdStr,
    group: groupIdObj
      ? {
          id: groupIdStr,
          name: groupName ?? "",
          sortOrder: groupSortOrder ?? 0,
        }
      : null,
    title: guide.title ?? "",
    content: guide.content || "",
    roleContents,
    assignedRoles: [],
    sortOrder: guide.sortOrder ?? 0,
    status: (guide.status === "active" || guide.status === "inactive" ? guide.status : "active") as "active" | "inactive",
    
  };
}

export async function getUserGuides({
  page = 1,
  limit = 20,
  search = "",
  status = "all",
  group = "all",
}: GetUserGuidesParams) {
  await ensureUserGuideSetup();

  const skip = (page - 1) * limit;
  const query: Record<string, unknown> = { deletedAt: null };

  if (search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: "i" } },
      { assignedRoles: { $regex: search.trim(), $options: "i" } },
    ];
  }

  if (status !== "all") {
    query.status = status.toLowerCase();
  }

  if (group !== "all") {
    query.groupId = group;
  }

  const [data, total, allRoles] = await Promise.all([
    UserGuide.find(query)
      .populate({
        path: "groupId",
        model: UserGuideGroup,
        match: { deletedAt: null },
        select: "name sortOrder status",
      })
      .sort({ title: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    UserGuide.countDocuments(query),
    Role.find().select("_id name").lean(),
  ]);

  const roleIdToName = new Map(allRoles.map((r: any) => [r._id.toString(), r.name]));

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    data: data.filter((item) => item.groupId).map((guide) => {
      const serialized = serializeGuide(guide);
      const rawRoles = guide.assignedRoles || [];
      serialized.assignedRoles = rawRoles.map((r: any) => {
        if (!r) return "";
        let roleIdStr: string;
        if (typeof r === 'string') {
          roleIdStr = r;
        } else if (r && typeof r === 'object' && r.toString) {
          roleIdStr = r.toString();
        } else {
          roleIdStr = String(r);
        }
        return roleIdToName.get(roleIdStr) || roleIdStr;
      });
      return serialized;
    }),
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

export async function getActiveUserGuides(userRoleName?: string) {
  await ensureUserGuideSetup();

  const allRoleDocs = await Role.find({ status: "active" }).select("_id name").lean();
  const roleNameToId = new Map(allRoleDocs.map(r => [r.name.toLowerCase(), r._id]));
  const roleIdToName = new Map(allRoleDocs.map(r => [r._id.toString(), r.name]));

  let roleId: mongoose.Types.ObjectId | undefined;
  if (userRoleName) {
    const foundId = roleNameToId.get(userRoleName.toLowerCase());
    if (foundId) {
      roleId = foundId;
    }
  }

  const query: Record<string, unknown> = {
    deletedAt: null,
    status: "active",
  };

  if (roleId || userRoleName) {
    query.$or = [
      { assignedRoles: { $size: 0 } },
      ...(roleId ? [{ assignedRoles: roleId }] : []),
      ...(userRoleName ? [{ assignedRoles: userRoleName }] : []),
    ];
  }

  const data = await UserGuide.find(query)
    .populate({
      path: "groupId",
      model: UserGuideGroup,
      match: { deletedAt: null, status: "active" },
      select: "name sortOrder status",
    })
    .lean();

  return data.filter((item) => item.groupId).map((guide) => {
    const serialized = serializeGuide(guide);
    serialized.assignedRoles = (guide.assignedRoles || []).map((role: any) => {
      if (!role) return "";
      const roleIdStr = typeof role === 'string' ? role : role.toString();
      return roleIdToName.get(roleIdStr) || roleIdStr;
    });
    return serialized;
  });
}

interface GetUserGuideGroupsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export async function getUserGuideGroups({
  page = 1,
  limit = 20,
  search = "",
  status = "all",
}: GetUserGuideGroupsParams) {
  await ensureUserGuideSetup();

  const skip = (page - 1) * limit;
  const query: Record<string, unknown> = { deletedAt: null };

  if (search.trim()) {
    query.name = { $regex: search.trim(), $options: "i" };
  }

  if (status !== "all") {
    query.status = status.toLowerCase();
  }

  const [data, total] = await Promise.all([
    UserGuideGroup.find(query).sort({ sortOrder: 1, name: 1 }).skip(skip).limit(limit).lean(),
    UserGuideGroup.countDocuments(query),
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
