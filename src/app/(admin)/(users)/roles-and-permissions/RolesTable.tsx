"use client";

import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import EditModal from "@/components/common/EditModal";
import ViewModal from "@/components/common/ViewModal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import PermissionGrid, { IPermission } from "@/components/roles/PermissionGrid";
import PermissionLegend from "@/components/roles/PermissionLegend";
import RoleComponentCard from "@/components/roles/RoleComponentCard";
import CommonReportTable from "@/components/tables/CommonReportTable";
import Badge from "@/components/ui/badge/Badge";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useRouter, useSearchParams } from "next/navigation"; // 1. Added Router
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import DashboardWidgetSection from "@/components/roles/DashboardWidgetSection";

// --- Types ---
interface IRole {
  _id: string;
  name: string;
  permissions: string[];
  status: string;
  createdAt: string;
}

// 2. Updated Props Interface
interface RolesTableProps {
  data: IRole[]; // Received from Server
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function RolesTable({
  data,
  pagination,
}: RolesTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 3. Optimistic State (Initialized from props)
  const [roles, setRoles] = useState<IRole[]>(data);
  const [allPermissions, setAllPermissions] = useState<IPermission[]>([]);
  const [loading, setLoading] = useState(false); // No longer needed for initial load

  // 4. Sync Effect: Update local state when server data changes
  useEffect(() => {
    setRoles(data);
  }, [data]);

  // Pagination State (Derived from props effectively, but kept for UI control)
  const currentPage = pagination.page;
  const totalPages = pagination.totalPages;
  const LIMIT = 20;

  // Modal States
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [selectedRole, setSelectedRole] = useState<IRole | null>(null);
  const [editData, setEditData] = useState<IRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isSelectedRoleSuperAdmin = selectedRole?.name?.toLowerCase() === "super-admin";
  const isEditingSuperAdmin = editData?.name?.toLowerCase() === "super-admin";
  
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const { can, isReady } = useAuthorization();
  const canEdit = can("roles.edit");
  const canDelete = can("roles.delete");

  // --- Fetch Permissions (Keep Client-Side for Modal) ---
  useEffect(() => {
    async function fetchPerms() {
      try {
        // We only need this list when opening the Edit/View modal
        const res = await fetch("/api/permissions");
        if (res.ok) {
          const result = await res.json();
          // Adjust based on your API response structure (array vs { data: [] })
          setAllPermissions(Array.isArray(result) ? result : result.data || []);
        }
      } catch (err) {
        console.error("Failed to load permissions", err);
      }
    }
    fetchPerms();
  }, []);

  // 5. Handle Page Change via Router
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  // --- Actions ---
  const handleView = (role: IRole) => {
    setSelectedRole(role);
    setOpenView(true);
  };

  const handleEdit = (role: IRole) => {
    setSelectedRole(role);
    setEditData({ ...role });
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!selectedRole || !editData) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/roles/${selectedRole._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editData.name,
          status: editData.status,
          permissions: editData.permissions,
        }),
      });

      if (!res.ok) throw new Error();
      const { role } = await res.json();

      // 6. Optimistic Update
      setRoles((prev) => prev.map((r) => (r._id === role._id ? role : r)));
      
      toast.success("Role updated successfully");
      setOpenEdit(false);
      
      // 7. Sync Server
      router.refresh();
    } catch {
      toast.error("Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/roles/${selectedRole._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();

      // 6. Optimistic Update
      setRoles((prev) => prev.filter((r) => r._id !== selectedRole._id));
      
      toast.success("Role deleted successfully");
      setOpenDelete(false);
      
      // 7. Sync Server
      router.refresh();
    } catch {
      toast.error("Failed to delete role");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: "S.No",
      render: (_: IRole, index: number) =>
        (currentPage - 1) * LIMIT + index + 1,
    },
    {
      header: "Role Name",
      render: (r: IRole) => (
        <span className="font-medium text-gray-700 dark:text-gray-200">
          {r.name}
        </span>
      ),
    },
    {
      header: "Status",
      render: (r: IRole) => (
        <Badge color={r.status === "active" ? "success" : "error"}>
          {r.status === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  if (!isReady) return null;

  return (
    <>
      <div className="border border-gray-200 bg-white text-gray-800 dark:border-white/10 dark:bg-slate-900 dark:text-gray-100 rounded-xl">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1200px]">
            <CommonReportTable
              data={roles} // Use optimistic data
              columns={columns}
              loading={loading}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onRowClick={handleView}
              onView={handleView}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={canDelete ? (r: IRole) => { setSelectedRole(r); setOpenDelete(true); } : undefined}
            />
          </div>
        </div>
      </div>

      {/* --- VIEW MODAL --- */}
      <ViewModal
        isOpen={openView}
        onClose={() => setOpenView(false)}
        title="Role Details"
      >
        <div className="space-y-4 text-sm">
          <RoleComponentCard title="General Information">
            <div className="flex flex-row items-start justify-between w-full px-1">
              <div className="flex flex-col gap-1">
                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                  Role Name
                </p>
                <p className=" text-gray-900 dark:text-white text-base">
                  {selectedRole?.name}
                </p>
              </div>

              <div className="flex flex-col gap-1 items-end ">
                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                  Role Status
                </p>
                <Badge
                  color={selectedRole?.status === "active" ? "success" : "error"}
                >
                  <span className="uppercase font-bold text-[10px]">
                    {selectedRole?.status === "active" ? "Active" : "Inactive"}
                  </span>
                </Badge>
              </div>
            </div>
          </RoleComponentCard>

          <RoleComponentCard
            title="Assigned Permissions"
            legend={<PermissionLegend />}
          >
            {selectedRole && (
              <div className="space-y-8">
                <div>
                  <PermissionGrid
                    allPermissions={allPermissions}
                    selectedPermissions={selectedRole.permissions}
                    isReadOnly={true}
                  />
                </div>
                <div className=" opacity-80 border-gray-200 dark:border-white/10 ">
                  <DashboardWidgetSection
                    isSuperAdmin={selectedRole.name.toLowerCase() === "super-admin"}
                    allPermissions={allPermissions}
                    selectedPermissions={selectedRole.permissions}
                    onToggle={() => {}}
                  />
                </div>
              </div>
            )}
          </RoleComponentCard>
        </div>
      </ViewModal>

      {/* --- EDIT MODAL --- */}
      <EditModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit Role"
        loading={saving}
        onSubmit={handleUpdate}
      >
        {editData && (
          <div className="max-h-[70vh] overflow-y-auto p-1 space-y-5">
            <RoleComponentCard
              title="Role Information"
              className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Role Name</Label>
                  <Input
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    options={statusOptions}
                    value={editData.status}
                    onChange={(val) =>
                      setEditData({ ...editData, status: val as any })
                    }
                  />
                </div>
              </div>
            </RoleComponentCard>

            <RoleComponentCard
              title="Permissions"
              desc={
                isEditingSuperAdmin
                  ? "Super Admin has all permissions by default."
                  : "Assign permissions to this role by selecting from the list below."
              }
              className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
              legend={<PermissionLegend />}
            >
              <div className="space-y-8">
                <div className="border-t border-gray-100 dark:border-gray-800"></div>

                <div>
                  <PermissionGrid
                    allPermissions={allPermissions}
                    selectedPermissions={editData.permissions}
                    isReadOnly={isEditingSuperAdmin}
                    onToggle={(slug, checked) => {
                      const newPerms = checked
                        ? [...editData.permissions, slug]
                        : editData.permissions.filter((p) => p !== slug);
                      setEditData({ ...editData, permissions: newPerms });
                    }}
                  />
                </div>
                <DashboardWidgetSection
                  isReadOnly={isEditingSuperAdmin}
                  isSuperAdmin={isEditingSuperAdmin}
                  allPermissions={allPermissions}
                  selectedPermissions={editData.permissions}
                  onToggle={(slug, checked) => {
                    const newPerms = checked
                      ? [...editData.permissions, slug]
                      : editData.permissions.filter((p) => p !== slug);
                    setEditData({ ...editData, permissions: newPerms });
                  }}
                />
              </div>
            </RoleComponentCard>
          </div>
        )}
      </EditModal>

      {/* --- DELETE MODAL --- */}
      <ConfirmDeleteModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
        title="Delete Role"
        description={`Are you sure you want to delete the role "${selectedRole?.name}"?`}
        loading={isDeleting}
      />
    </>
  );
}