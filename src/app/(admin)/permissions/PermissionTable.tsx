"use client";

import SearchableSelect from "@/components/form/SearchableSelect";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { toast } from "react-toastify";

// UI Components
import ComponentCard from "@/components/common/ComponentCard";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import EditModal from "@/components/common/EditModal";
import ViewModal from "@/components/common/ViewModal";
import CommonReportTable from "@/components/tables/CommonReportTable";
import Badge from "@/components/ui/badge/Badge";
// Form Components
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import ConfirmModal from "@/components/modal/ConfirmModal";

// --- Types ---
interface UserRef {
  _id: string;
  fullName: string;
}

interface ResourceRef {
  _id: string;
  name: string;
}

interface Permission {
  _id: string;
  slug: string;
  name: string;
  description: string;
  group?: string;
  resourceId?: ResourceRef | string;
  status: "active" | "inactive";
  createdBy?: UserRef;
  updatedBy?: UserRef;
  createdAt?: string;
  updatedAt?: string;
}

interface EditFormData extends Omit<
  Permission,
  "_id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
> {
  resourceId?: string;
}

// ✅ UPDATED PROPS: Receive data from Server instead of fetching it
interface PermissionTableProps {
  data: Permission[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
  resourceOptions: { id: string; name: string }[];
}

export default function PermissionTable({
  data,
  pagination,
  resourceOptions,
}: PermissionTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can, isReady } = useAuthorization();

  // ✅ 1. OPTIMISTIC STATE: Initialize with server data
  // This allows us to update the UI instantly without waiting for a refresh
  const [optimisticData, setOptimisticData] = useState<Permission[]>(data);

  // ✅ 2. SYNC EFFECT: Update local state when Filters/Page change
  useEffect(() => {
    setOptimisticData(data);
  }, [data]);

  // Modals
  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openSlugConfirm, setOpenSlugConfirm] = useState(false);
  
  // Selection
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [editData, setEditData] = useState<EditFormData | null>(null);

  const canEdit = can("permission.edit");
  const canDelete = can("permission.delete");

  const selectOptions = useMemo(
    () => resourceOptions.map((m) => ({ value: m.id, label: m.name })),
    [resourceOptions],
  );

  // ✅ 3. Handle Page Change via Router (Server Fetch)
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  /* ================= COLUMNS ================= */
  const columns = [
    {
      header: "S.No",
      render: (_: Permission, index: number) =>
        (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      header: "Resource",
      render: (p: any) => (
        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize ">
          {p.resourceId?.name || p.group || "General"}
        </span>
      ),
    },
    {
      header: "Permission",
      render: (p: Permission) => (
        <div className="flex flex-col gap-0.5 min-w-[150px]">
          <span className="text-sm font-medium text-gray-900 capitalize dark:text-white">
            {p.name || "-"}
          </span>
          <span className="text-gray-500 dark:text-gray-400 font-mono text-[10px]">
            {p.slug}
          </span>
        </div>
      ),
    },
    {
      header: "Description",
      render: (p: Permission) => (
        <span className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed max-w-[250px] truncate block">
          {p.description}
        </span>
      ),
    },
    {
      header: "Status",
      render: (p: Permission) => (
        <Badge color={p.status === "active" ? "success" : "error"}>
          {p.status === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  /* ================= ACTIONS ================= */
  const handleEdit = (p: Permission) => {
    setSelectedPermission(p);
    const resId = typeof p.resourceId === "object" ? (p.resourceId as any)._id : p.resourceId;
    setEditData({
      slug: p.slug,
      name: p.name || "",
      description: p.description,
      group: p.group,
      status: p.status,
      resourceId: resId,
    });
    setOpenEdit(true);
  };

  const handleView = (p: Permission) => {
    setSelectedPermission(p);
    setOpenView(true);
  };

  const handleUpdate = async (force = false) => {
    if (!selectedPermission || !editData) return;

    const isSlugChanged = editData.slug !== selectedPermission.slug;
    if (isSlugChanged && !force) {
      setOpenSlugConfirm(true);
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/permissions/${selectedPermission._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Update failed");

      // ✅ 4. INSTANT UI UPDATE
      setOptimisticData((prev) =>
        prev.map((p) => (p._id === selectedPermission._id ? { ...p, ...result.data } : p)),
      );

      toast.success("Permission updated");
      setOpenEdit(false);
      setOpenSlugConfirm(false);
      setSelectedPermission(null);
      
      // Sync Server Data in background
      router.refresh();

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPermission) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/permissions/${selectedPermission._id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Delete failed");

      // ✅ 5. INSTANT UI UPDATE
      setOptimisticData((prev) =>
        prev.filter((p) => p._id !== selectedPermission._id),
      );

      toast.success("Permission removed");
      setOpenDelete(false);
      setSelectedPermission(null);
      
      // Sync Server Data in background
      router.refresh();

    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isReady) return null;

  return (
    <>
      <div className="border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900 rounded-xl">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1200px]">
            <CommonReportTable
              data={optimisticData} // Use optimistic data
              columns={columns}
              loading={false} // Data is pre-fetched
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              onRowClick={handleView}
              onView={handleView}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={canDelete ? (p) => { setSelectedPermission(p); setOpenDelete(true); } : undefined}
            />
          </div>
        </div>
      </div>

      {/* VIEW MODAL (Unchanged) */}
      <ViewModal isOpen={openView} onClose={() => setOpenView(false)} title="Permission Details" size="sm">
        <div className="text-[13px] py-1 max-w-md mx-auto">
          <div className="flex flex-col gap-y-6">
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">Permissions</h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Permission Name</span>
                <span className="font-medium capitalize text-right">{selectedPermission?.name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Slug</span>
                <span className="font-mono text-right text-gray-700 dark:text-gray-300">{selectedPermission?.slug}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Resource</span>
                <span className="font-medium text-right capitalize tracking-tight text-gray-700 dark:text-gray-300">
                  {(selectedPermission?.resourceId as ResourceRef)?.name || selectedPermission?.group || "General"}
                </span>
              </div>
            </section>
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">Description</h3>
              <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{selectedPermission?.description || "No description provided."}</p>
            </section>
          </div>
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ">Status</span>
            <Badge color={selectedPermission?.status === "active" ? "success" : "default"}>
              <span className="capitalize">{selectedPermission?.status || "active"}</span>
            </Badge>
          </div>
        </div>
      </ViewModal>

      {/* EDIT MODAL (Unchanged) */}
      <EditModal isOpen={openEdit} onClose={() => setOpenEdit(false)} title="Edit Permission" loading={saving} onSubmit={() => handleUpdate(false)}>
        {editData && (
          <div className="max-h-[75vh] overflow-y-auto p-1 space-y-5 custom-scrollbar">
            <ComponentCard title="" className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <Label>Permission</Label>
                  <Input placeholder="e.g. Create Brand" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                </div>
                <div>
                  <Label>Resource</Label>
                  <SearchableSelect options={selectOptions} value={editData.resourceId || ""} onChange={(val) => setEditData({ ...editData, resourceId: val, group: "" })} placeholder="Select Resource" />
                </div>
                <div>
                  <Label>Permission Slug</Label>
                  <Input className="font-mono text-sm" value={editData.slug} onChange={(e) => setEditData({ ...editData, slug: e.target.value })} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} value={editData.status} onChange={(val) => setEditData({ ...editData, status: val as any })} />
                </div>
                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Input value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} />
                </div>
              </div>
            </ComponentCard>
          </div>
        )}
      </EditModal>

      <ConfirmDeleteModal isOpen={openDelete} onClose={() => setOpenDelete(false)} onConfirm={handleDelete} loading={isDeleting} description="This permission defines access to a system resource. Deactivating it will remove this capability from all associated roles." />
      <ConfirmModal isOpen={openSlugConfirm} onClose={() => setOpenSlugConfirm(false)} onConfirm={() => handleUpdate(true)} loading={saving} variant="warning" title="Critical: Slug Change" confirmLabel="Update Anyway" description="Changing the slug will break any code-level permission checks." />
    </>
  );
}