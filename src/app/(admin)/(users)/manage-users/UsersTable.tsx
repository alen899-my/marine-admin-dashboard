"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Image from "next/image"; // ✅ Import Image
import { User as UserIcon } from "lucide-react"; // ✅ Import Icon for fallback

// --- Components ---
import ComponentCard from "@/components/common/ComponentCard";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import ViewModal from "@/components/common/ViewModal";
import CommonReportTable from "@/components/tables/CommonReportTable";
import Badge from "@/components/ui/badge/Badge";
import UserFormModal from "@/components/Users/UserFormModal";

// --- Permission Components ---
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
  role: any;
  status: string;
  profilePicture?: string; // ✅ Added this
  lastLogin?: string;
  createdAt: string;
  additionalPermissions?: string[];
  excludedPermissions?: string[];
}

interface UserTableProps {
  refresh: number;
  search: string;
  status: string;
  startDate: string;
  endDate: string;
  setTotalCount?: Dispatch<SetStateAction<number>>;
}

export default function UserTable({
  refresh,
  search,
  status,
  startDate,
  endDate,
  setTotalCount,
}: UserTableProps) {
  // --- Data State ---
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- Metadata State ---
  const [rolesList, setRolesList] = useState<RoleData[]>([]);
  const [allPermissions, setAllPermissions] = useState<IPermission[]>([]);

  // --- Modal States ---
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<IUser | null>(null);
  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;
  const { can } = useAuthorization();

  const canEditUser = can("users.edit");
  const canDeleteUser = can("users.delete");

  // --- 1. Fetch Metadata ---
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

  // --- Helper: Get Permissions ---
  const getSelectedUserRolePermissions = () => {
    if (!selectedUser) return [];
    const roleId = typeof selectedUser.role === 'object' ? selectedUser.role._id : selectedUser.role;
    const roleObj = rolesList.find(r => r._id === roleId);
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
      render: (u: IUser) => (
        <div className="flex items-center gap-3">
          {/* ✅ Avatar Display in Table */}
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
          <span className="font-medium text-gray-700 dark:text-gray-200">{u.fullName}</span>
        </div>
      ),
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

           // UPDATE DYNAMIC COUNT
        if (setTotalCount) {
          setTotalCount(result.pagination?.total || result.length || 0);
        }

        setTotalPages(result.pagination?.totalPages || 1);
      } catch (err) {
        console.error(err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [LIMIT, search, status, startDate, endDate, setTotalCount]
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
     setIsDeleting(true);

    try {
      const res = await fetch(`/api/users/${selectedUser._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.filter((u) => u._id !== selectedUser._id));
      // UPDATE DYNAMIC COUNT ON DELETE
      if (setTotalCount) {
        setTotalCount((prev) => Math.max(0, prev - 1));
      }
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
        
         {/* 2. General Info with Avatar */}
          <ComponentCard title="General Information">
             <div className="flex flex-col sm:flex-row gap-20 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
               
             {/* <div className="flex-shrink-0 flex flex-col items-center gap-2"> */}
  {/* Image Container */}
  {/* <div className="w-20 h-20 ml-5 relative rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-700 shadow-sm">
    {selectedUser?.profilePicture ? (
      <Image 
        src={selectedUser.profilePicture} 
        alt="Profile" 
        fill 
        className="object-cover" 
        unoptimized
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center">
         <UserIcon className="w-8 h-8 text-gray-400" />
      </div>
    )}
  </div> */}

  {/* Label */}
  {/* <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
    User Profile
  </span> */}
{/* </div> */}

                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Full Name</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedUser?.fullName ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email Address</p>
                    <p className="font-medium text-gray-900 dark:text-white break-all">
                      {selectedUser?.email ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedUser?.phone ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">System Role</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatRole(selectedUser?.role || "")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Account Status</p>
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
              legend={!isSelectedUserSuperAdmin ? <PermissionLegend showAll={true} /> : null}
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
                  onToggle={() => {}} // Read-only
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
          fetchUsers(currentPage); // Refresh
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