"use client";

import { User as UserIcon } from "lucide-react"; // Import Icon for fallback
import Image from "next/image"; // Import Image
import { useRouter, useSearchParams } from "next/navigation"; // ✅ Added Router
import { useState } from "react";
import { toast } from "react-toastify";

// --- Components ---
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import ViewModal from "@/components/common/ViewModal";
import CommonReportTable from "@/components/tables/CommonReportTable";
import Badge from "@/components/ui/badge/Badge";
import UserFormModal from "@/components/Users/UserFormModal";

// --- Permission Components ---
import RoleComponentCard from "@/components/roles/RoleComponentCard";
import PermissionLegend from "@/components/Users/components/PermissionLegend";
import PermissionMatrixTable from "@/components/Users/components/PermissionMatrixTable";
import DashboardWidgetSectionUser from "@/components/Users/DashboardWidgetSectionUser";
import { useAuthorization } from "@/hooks/useAuthorization";

// --- Types ---
interface IPermission {
  _id: string;
  slug: string;
  name: string;
  description?: string;
  group: string;
}

interface RoleData {
  _id: string;
  name: string;
  permissions?: string[];
}

export interface IUser {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: any;
  company?: { _id: string; name: string } | any;
  status: string;
  profilePicture?: string;
  lastLogin?: string;
  createdAt: string;
  additionalPermissions?: string[];
  excludedPermissions?: string[];
}

// ✅ Updated Props Interface
interface UserTableProps {
  data: IUser[]; // Data passed from Server
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  roles: RoleData[];
  permissions: IPermission[];
}

export default function UserTable({
  data,
  pagination,
  roles,
  permissions,
}: UserTableProps) {
  const router = useRouter(); // ✅ Init Router
  const searchParams = useSearchParams();

  // 1. Use Props for Data
  const users = data;
  const loading = false; // Data is pre-fetched

  // Metadata State (from props)
  const rolesList = roles;
  const allPermissions = permissions;

  // --- Modal States ---
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<IUser | null>(null);
  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { can } = useAuthorization();

  const canEditUser = can("users.edit");
  const canDeleteUser = can("users.delete");

  // --- Helper: Format Role ---
  const formatRole = (role: any) => {
    if (!role) return "N/A";
    if (typeof role === "object" && role.name) return role.name;
    if (typeof role === "string") {
      return role
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
    return "Unknown";
  };

  // --- Helper: Get Permissions ---
  const getSelectedUserRolePermissions = () => {
    if (!selectedUser) return [];
    const roleId =
      typeof selectedUser.role === "object"
        ? selectedUser.role._id
        : selectedUser.role;
    const roleObj = rolesList.find((r) => r._id === roleId);
    return (
      roleObj?.permissions ||
      (typeof selectedUser.role === "object"
        ? selectedUser.role.permissions
        : []) ||
      []
    );
  };

  // ✅ Page Change Logic (via URL)
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  // --- Table Columns ---
  const columns = [
    {
      header: "S.No",
      render: (_: IUser, index: number) =>
        (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      header: "Full Name",
      render: (u: IUser) => (
        <div className="flex items-center gap-3">
          {/* Avatar Display in Table */}
          <div className="w-9 h-9 relative rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex-shrink-0">
            {u.profilePicture ? (
              <Image
                src={u.profilePicture}
                alt={u.fullName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </div>
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {u.fullName}
          </span>
        </div>
      ),
    },
    {
      header: "Email",
      render: (u: IUser) => u.email,
    },
    {
      header: "Company",
      render: (u: IUser) => {
        const companyName =
          typeof u.company === "object" ? u.company?.name : "N/A";
        return (
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {companyName || "N/A"}
          </span>
        );
      },
    },
    {
      header: "Role",
      render: (user: any) => (
        <span className="font-medium text-gray-700 dark:text-gray-200">
          {formatRole(user.role)}
        </span>
      ),
    },
    {
      header: "Phone",
      render: (u: IUser) => u.phone || "-",
    },
    {
      header: "Status",
      render: (u: IUser) => (
        <Badge color={u.status === "active" ? "success" : "error"}>
          {u.status === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const selectedUserRoleName =
    typeof selectedUser?.role === "object"
      ? selectedUser.role.name
      : selectedUser?.role;

  const isSelectedUserSuperAdmin =
    selectedUserRoleName?.toLowerCase() === "super-admin";

  // --- HANDLERS ---
  const handleView = (user: IUser) => {
    setSelectedUser(user);
    setOpenView(true);
  };

  const handleEdit = (user: IUser) => {
    setUserToEdit(user);
    setEditModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/users/${selectedUser._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();

      // ✅ Refresh Server Data
      router.refresh();

      toast.success("User deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete user");
    } finally {
      setOpenDelete(false);
      setSelectedUser(null);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="border border-gray-200 bg-white text-gray-800 dark:border-white/10 dark:bg-slate-900 dark:text-gray-100 rounded-xl">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1200px]">
            <CommonReportTable
              data={users}
              columns={columns}
              loading={loading}
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange} // ✅ URL Pagination
              onView={handleView}
              onRowClick={handleView}
              onEdit={canEditUser ? handleEdit : undefined}
              onDelete={
                canDeleteUser
                  ? (u: IUser) => {
                      setSelectedUser(u);
                      setOpenDelete(true);
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </div>

      {/* --- VIEW MODAL --- */}
      <ViewModal
        isOpen={openView}
        onClose={() => setOpenView(false)}
        title="User Details & Permissions"
      >
        <div className=" text-sm">
          <div className="text-[13px] py-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {/* 1. PHOTO & NAME */}
              <section className="space-y-1.5 p-3">
                <h3 className="text-[11px] font-bold text-gray-400  tracking-wider mb-2 border-b">
                  General Information
                </h3>
                <div className="flex items-center gap-4 py-2">
                  {/* Image Container must have 'relative' for Next.js Image fill to work */}
                  <div className="w-16 h-16 relative rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-700 shadow-sm shrink-0">
                    {selectedUser?.profilePicture ? (
                      <Image
                        src={selectedUser.profilePicture}
                        alt="Profile"
                        fill
                        sizes="64px"
                        className="object-cover"
                        priority
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        <span className="text-xl font-bold text-gray-400">
                          {selectedUser?.fullName?.charAt(0) || "U"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                      {selectedUser?.fullName ?? "-"}
                    </span>
                    <span className="text-gray-500 text-[10px] uppercase tracking-tight">
                      User Profile
                    </span>
                  </div>
                </div>
              </section>

              {/* 2. CONTACT DETAILS */}
              <section className="space-y-1.5 p-3">
                <h3 className="text-[11px] font-bold text-gray-400  tracking-wider mb-2 border-b">
                  Contact Details
                </h3>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Email Address</span>
                  <span className="font-medium text-right break-all">
                    {selectedUser?.email ?? "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Phone Number</span>
                  <span className="font-medium text-right">
                    {selectedUser?.phone ?? "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Company</span>
                  <span className="font-medium text-right">
                    {typeof selectedUser?.company === "object"
                      ? selectedUser.company.name
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">System Role</span>
                  <span className="font-medium text-right">
                    {formatRole(selectedUser?.role || "")}
                  </span>
                </div>
              </section>
            </div>

            {/* STATUS FOOTER */}
            <div className=" p-3   dark: flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400  tracking-widest">
                Account Status
              </span>
              <Badge
                color={selectedUser?.status === "active" ? "success" : "error"}
              >
                <span className="capitalize">
                  {selectedUser?.status || "inactive"}
                </span>
              </Badge>
            </div>
          </div>

          {/* 3. Permissions Matrix (Read Only) */}
          {selectedUser && (
            <RoleComponentCard
              title="Permissions"
              desc={
                isSelectedUserSuperAdmin
                  ? "All permissions are automatically granted for Super Admin."
                  : "Current effective permissions for this user."
              }
              legend={
                !isSelectedUserSuperAdmin ? (
                  <PermissionLegend showAll={true} />
                ) : null
              }
            >
              <div className="space-y-6">
                <PermissionMatrixTable
                  allPermissions={allPermissions}
                  rolePermissions={getSelectedUserRolePermissions()}
                  additionalPermissions={
                    selectedUser.additionalPermissions || []
                  }
                  excludedPermissions={selectedUser.excludedPermissions || []}
                  onToggle={() => {}} // View-only
                  isReadOnly={true}
                />
                <DashboardWidgetSectionUser
                  allPermissions={allPermissions}
                  rolePermissions={getSelectedUserRolePermissions()}
                  additionalPermissions={
                    selectedUser.additionalPermissions || []
                  }
                  excludedPermissions={selectedUser.excludedPermissions || []}
                  onToggle={() => {}} // Read-only
                  isReadOnly={true}
                  isSuperAdmin={isSelectedUserSuperAdmin}
                />
              </div>
            </RoleComponentCard>
          )}
        </div>
      </ViewModal>

      <UserFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={() => {
          router.refresh(); // ✅ Refresh on Edit Success
        }}
        initialData={userToEdit}
      />

      <ConfirmDeleteModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
        title="Delete User"
        description={`Are you sure you want to delete ${selectedUser?.fullName}? This action cannot be undone.`}
        loading={isDeleting}
      />
    </>
  );
}
