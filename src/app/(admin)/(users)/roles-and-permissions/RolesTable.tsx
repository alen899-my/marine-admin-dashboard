"use client";

import ComponentCard from "@/components/common/ComponentCard";
import RoleComponentCard from "@/components/roles/RoleComponentCard";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import EditModal from "@/components/common/EditModal";
import ViewModal from "@/components/common/ViewModal";
import Input from "@/components/form/input/InputField";
import PermissionLegend from "@/components/roles/PermissionLegend";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import CommonReportTable from "@/components/tables/CommonReportTable";
import Badge from "@/components/ui/badge/Badge";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuthorization } from "@/hooks/useAuthorization";
import PermissionGrid, { IPermission } from "@/components/roles/PermissionGrid";
// 1. Import the Widget Section
import DashboardWidgetSection from "@/components/roles/DashboardWidgetSection";

// --- Types ---
interface IRole {
  _id: string;
  name: string;
  permissions: string[]; // Array of slugs
  status: string;
  createdAt: string;
}

interface RolesTableProps {
  refresh: number;
  search: string;
  status: string;
  startDate: string;
  endDate: string;
}

export default function RolesTable({
  refresh,
  search,
  status,
  startDate,
  endDate,
}: RolesTableProps) {
  const [roles, setRoles] = useState<IRole[]>([]);
  const [allPermissions, setAllPermissions] = useState<IPermission[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

  // Modal States
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [selectedRole, setSelectedRole] = useState<IRole | null>(null);
  const [editData, setEditData] = useState<IRole | null>(null);
  const [saving, setSaving] = useState(false);

  // Status Options
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const { can, isReady } = useAuthorization();
  const canEdit = can("roles.edit"); // Corrected permission check
  const canDelete = can("roles.delete");

  // --- Fetch Permissions ---
  useEffect(() => {
    async function fetchPerms() {
      try {
        const res = await fetch("/api/permissions");
        if (res.ok) {
          const data = await res.json();
          setAllPermissions(data);
        }
      } catch (err) {
        console.error("Failed to load permissions", err);
      }
    }
    fetchPerms();
  }, []);

  // --- Fetch Roles ---
  const fetchRoles = useCallback(
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

        const res = await fetch(`/api/roles?${query.toString()}`);
        if (!res.ok) throw new Error();
        const result = await res.json();

        setRoles(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
      } catch (err) {
        console.error(err);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    },
    [search, status, startDate, endDate]
  );

  useEffect(() => {
    fetchRoles(1);
    setCurrentPage(1);
  }, [refresh, fetchRoles]);

  useEffect(() => {
    fetchRoles(currentPage);
  }, [currentPage, fetchRoles]);

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

      setRoles((prev) => prev.map((r) => (r._id === role._id ? role : r)));
      toast.success("Role updated successfully");
      setOpenEdit(false);
    } catch {
      toast.error("Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    try {
      const res = await fetch(`/api/roles/${selectedRole._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();

      setRoles((prev) => prev.filter((r) => r._id !== selectedRole._id));
      toast.success("Role deleted successfully");
    } catch {
      toast.error("Failed to delete role");
    } finally {
      setOpenDelete(false);
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
              data={roles}
              columns={columns}
              loading={loading}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onView={handleView}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={
                canDelete
                  ? (r: IRole) => {
                      setSelectedRole(r);
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
        title="Role Details"
      >
        <div className="space-y-6 text-sm">
          <RoleComponentCard title="General Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">Role Name</p>
                <p className="font-medium">{selectedRole?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <Badge
                  color={selectedRole?.status === "active" ? "success" : "error"}
                >
                  {selectedRole?.status === "active" ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </RoleComponentCard>

          <RoleComponentCard title="Assigned Permissions" legend={<PermissionLegend />}>
            {selectedRole && (
              <div className="space-y-8">
                
                {/* 2. Dashboard Widgets (Read Only) */}
                

                <div className="border-t border-gray-100 dark:border-gray-800"></div>

                <div>
                   <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Module Access Control
                  </h3>
                  <PermissionGrid 
                    allPermissions={allPermissions}
                    selectedPermissions={selectedRole.permissions}
                    isReadOnly={true}
                  />
                </div>
                <div className="pointer-events-none opacity-80">
                  <DashboardWidgetSection 
                    selectedPermissions={selectedRole.permissions}
                    onToggle={() => {}} // No-op for read-only
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
            <RoleComponentCard title="Role Information">
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
                      setEditData({ ...editData, status: val })
                    }
                  />
                </div>
              </div>
            </RoleComponentCard>

            <RoleComponentCard title="Permissions" legend={<PermissionLegend />}>
               <div className="space-y-8">
                
                {/* 3. Dashboard Widgets (Editable) */}
               

                <div className="border-t border-gray-100 dark:border-gray-800"></div>

                <div>
                   <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Module Access Control
                  </h3>
                  <PermissionGrid 
                    allPermissions={allPermissions}
                    selectedPermissions={editData.permissions}
                    isReadOnly={false}
                    onToggle={(slug, checked) => {
                      const newPerms = checked
                        ? [...editData.permissions, slug]
                        : editData.permissions.filter((p) => p !== slug);
                      setEditData({ ...editData, permissions: newPerms });
                    }}
                  />
                </div>
                 <DashboardWidgetSection 
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
      />
    </>
  );
}