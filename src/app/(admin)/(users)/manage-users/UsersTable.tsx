"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

// --- Components ---
import ComponentCard from "@/components/common/ComponentCard";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import ViewModal from "@/components/common/ViewModal";
import CommonReportTable from "@/components/tables/CommonReportTable";
import Badge from "@/components/ui/badge/Badge";
import UserFormModal from "@/components/Users/UserFormModal";

// --- Permission Components (Adjust paths if necessary based on your folder structure) ---
import RoleComponentCard from "@/components/roles/RoleComponentCard";
import PermissionMatrixTable from "@/components/Users/components/PermissionMatrixTable"; 
import PermissionLegend from "@/components/Users/components/PermissionLegend";
import { useAuthorization } from "@/hooks/useAuthorization";
import DashboardWidgetSectionUser from "@/components/Users/DashboardWidgetSectionUser";
// --- Types ---
interface IPermission {
  _id: string;
  slug: string;
  description?: string;
  group: string;
}

interface RoleData {
  _id: string;
  name: string;
  permissions?: string[];
}

interface IUser {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: any; // Can be string ID or Object
  status: string;
  lastLogin?: string;
  createdAt: string;
  // Permissions specific
  additionalPermissions?: string[];
  excludedPermissions?: string[];
}

interface UserTableProps {
  refresh: number;
  search: string;
  status: string;
  startDate: string;
  endDate: string;
}

export default function UserTable({
  refresh,
  search,
  status,
  startDate,
  endDate,
}: UserTableProps) {
  // --- Data State ---
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- Metadata State (Needed for View Permissions) ---
  const [rolesList, setRolesList] = useState<RoleData[]>([]);
  const [allPermissions, setAllPermissions] = useState<IPermission[]>([]);

  // --- Modal States ---
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<IUser | null>(null);
  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;
  const { can, isReady } = useAuthorization();

const canEditUser = can("users.edit");
const canDeleteUser = can("users.delete");

  // --- 1. Fetch Metadata (Roles & Permissions) for View Modal ---
  useEffect(() => {
    async function fetchMetadata() {
      try {
        const [rolesRes, permsRes] = await Promise.all([
          fetch("/api/roles"),
          fetch("/api/permissions")
        ]);

        if (rolesRes.ok) {
          const json = await rolesRes.json();
          setRolesList(json.data || []);
        }
        if (permsRes.ok) {
          const json = await permsRes.json();
          setAllPermissions(json);
        }
      } catch (error) {
        console.error("Failed to load metadata for view", error);
      }
    }
    fetchMetadata();
  }, []);

  // --- Helper: Format Role ---
  const formatRole = (role: any) => {
    if (!role) return "N/A";
    if (typeof role === 'object' && role.name) return role.name;
    if (typeof role === 'string') {
      return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    return "Unknown";
  };

  // --- Helper: Get Permissions for Selected User ---
  const getSelectedUserRolePermissions = () => {
    if (!selectedUser) return [];
    
    // 1. Try to get role ID
    const roleId = typeof selectedUser.role === 'object' ? selectedUser.role._id : selectedUser.role;
    
    // 2. Find role in loaded list
    const roleObj = rolesList.find(r => r._id === roleId);
    
    // 3. Return permissions (fallback to empty)
    return roleObj?.permissions || (typeof selectedUser.role === 'object' ? selectedUser.role.permissions : []) || [];
  };

  // --- Table Columns ---
  const columns = [
    {
      header: "S.No",
      render: (_: IUser, index: number) => (currentPage - 1) * LIMIT + index + 1,
    },
    {
      header: "Full Name",
      render: (u: IUser) => <span className="font-medium text-gray-700 dark:text-gray-200">{u.fullName}</span>,
    },
    {
      header: "Email",
      render: (u: IUser) => u.email,
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

  // --- Fetch Users ---
  const fetchUsers = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const query = new URLSearchParams({
          page: page.toString(),
          limit: LIMIT.toString(),
          search,
          status,
          startDate,
          endDate,
        });

        const res = await fetch(`/api/users?${query.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const result = await res.json();

        setUsers(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
      } catch (err) {
        console.error(err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [LIMIT, search, status, startDate, endDate]
  );
  const selectedUserRoleName =
  typeof selectedUser?.role === "object"
    ? selectedUser.role.name
    : selectedUser?.role;

  const isSelectedUserSuperAdmin =
  selectedUserRoleName?.toLowerCase() === "super-admin";

  useEffect(() => {
    fetchUsers(1);
    setCurrentPage(1);
  }, [fetchUsers, refresh]);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, fetchUsers]);

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
    try {
      const res = await fetch(`/api/users/${selectedUser._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.filter((u) => u._id !== selectedUser._id));
      toast.success("User deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete user");
    } finally {
      setOpenDelete(false);
      setSelectedUser(null);
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
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onView={handleView}
               onEdit={canEditUser ? handleEdit : undefined}
  onDelete={canDeleteUser ? (u: IUser) => {
    setSelectedUser(u);
    setOpenDelete(true);
  } : undefined}
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
        <div className="space-y-6 text-sm">
        

         {/* 2. General Info */}
          <ComponentCard title="General Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      
              {/* Full Name */}
              <div>
                <p className="text-sm text-gray-500 mb-1">Full Name</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedUser?.fullName ?? "-"}
                </p>
              </div>
                      
              {/* Email */}
              <div>
                <p className="text-sm text-gray-500 mb-1">Email Address</p>
                <p className="font-medium text-gray-900 dark:text-white break-all">
                  {selectedUser?.email ?? "-"}
                </p>
              </div>
                      
              {/* Phone */}
              <div>
                <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedUser?.phone ?? "-"}
                </p>
              </div>
                      
              {/* Role */}
              <div>
                <p className="text-sm text-gray-500 mb-1">System Role</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatRole(selectedUser?.role || "")}
                </p>
              </div>
                      
              {/* Status (Fixed Alignment) */}
              <div>
                <p className="text-sm text-gray-500 mb-1">Account Status</p>
                <div className="flex items-center">
                  <Badge color={selectedUser?.status === "active" ? "success" : "error"}>
                    {selectedUser?.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
                      
            </div>
          </ComponentCard>

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
                  additionalPermissions={selectedUser.additionalPermissions || []}
                  excludedPermissions={selectedUser.excludedPermissions || []}
                  onToggle={() => {}} // View-only
                  isReadOnly={true}
                />
                <DashboardWidgetSectionUser 
                  rolePermissions={getSelectedUserRolePermissions()}
                  additionalPermissions={selectedUser.additionalPermissions || []}
                  excludedPermissions={selectedUser.excludedPermissions || []}
                  onToggle={() => {}} // Read-only: No-op
                  isReadOnly={true}
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
    fetchUsers(currentPage); // Just refresh the table in the background
  }}
  initialData={userToEdit} 
/>

      {/* --- DELETE CONFIRMATION --- */}
      <ConfirmDeleteModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
        title="Delete User"
        description={`Are you sure you want to delete ${selectedUser?.fullName}? This action cannot be undone.`}
      />
    </>
  );
}