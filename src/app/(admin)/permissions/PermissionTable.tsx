"use client";

import { useCallback, useEffect, useState, useMemo,Dispatch,
  SetStateAction, } from "react";
import { toast } from "react-toastify";
import { useAuthorization } from "@/hooks/useAuthorization";
import SearchableSelect from "@/components/form/SearchableSelect";
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

interface EditFormData extends Omit<Permission, "_id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"> {
  resourceId?: string; 
}

interface PermissionTableProps {
  refresh: number;
  search: string;
  status: string;
  module: string;
   setTotalCount?: Dispatch<SetStateAction<number>>;
}
export default function PermissionTable({
  refresh,
  search,
  status,
  module,
  setTotalCount
}: PermissionTableProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [resourceOptions, setResourceOptions] = useState<{value: string, label: string}[]>([]);
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

 
  const { can, isReady } = useAuthorization();


const canEdit = can("permission.edit");
const canDelete = can("permission.delete");

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };



useEffect(() => {
  const fetchResources = async () => {
    try {
      const res = await fetch("/api/resources?limit=none&status=active");
      const data = await res.json();
      const resourceList = Array.isArray(data) ? data : (data.data || []);
      setResourceOptions(resourceList.map((r: any) => ({
        value: r._id,
        label: r.name
      })));
    } catch (error) {
      console.error("Failed to fetch resources", error);
    }
  };
  fetchResources();
}, []);

  /* ================= COLUMNS ================= */
  const columns = [
    {
      header: "S.No",
      render: (_: Permission, index: number) => (currentPage - 1) * LIMIT + index + 1,
    },
    {
      header: "Resource",
      render: (p: any) => ( // Changed type to any to handle populated object
        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize ">
       
          {p.resourceId?.name || p.group || "General"}
        </span>
      ),
    },
    {
  header: "Permission",
  render: (p: Permission) => (
    <div className="flex flex-col gap-0.5 min-w-[150px]">
      {/* Name Display */}
      <span className="text-sm font-medium text-gray-900 capitalize dark:text-white">
        {p.name || "-"}
      </span>
      {/* Slug Display */}
      <span className="text-gray-500 dark:text-gray-400 font-mono text-[10px]">
        {p.slug}
      </span>
    </div>
  ),
},
    {
      header: "Description",
      render: (p: Permission) => (
        <span className="text-xs text-gray-600 dark:text-gray-400  leading-relaxed max-w-[250px] inline-block">
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
const fetchPermissions = useCallback(async () => {
  try {
    setLoading(true);
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: "20",
      search: search || "",
      status: status || "all",
      resource: module || ""
    });

    const res = await fetch(`/api/permissions/all-permission?${params.toString()}`);
    if (!res.ok) throw new Error();
    const result = await res.json();
    
    setPermissions(result.data || []);
    
    // Check for actual change before calling parent state update
    if (setTotalCount && result.pagination?.total !== undefined) {
      setTotalCount(result.pagination.total);
    }
    setTotalPages(result.pagination?.totalPages || 1);
  } catch (err) {
    toast.error("Failed to load permissions");
  } finally {
    setLoading(false);
  }
}, [currentPage, search, status, module]); // Remove setTotalCount from deps

// 2. Optimized Effect Logic
useEffect(() => {
  // Only reset if we aren't already on page 1
  if (currentPage !== 1) {
    setCurrentPage(1);
  } else {
    // If we are already on page 1, manually trigger the fetch 
    // because the currentPage change won't trigger the effect below
    fetchPermissions();
  }
}, [search, status, module]);

useEffect(() => {
  // This handles the initial mount and whenever currentPage or refresh changes
  fetchPermissions();
}, [currentPage, refresh]);

  /* ================= ACTIONS ================= */
  const handleEdit = (p: Permission) => {
    setSelectedPermission(p);
    const resId = typeof p.resourceId === "object" ? p.resourceId._id : p.resourceId;
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

  // 1. Detect Slug Change
  const isSlugChanged = editData.slug !== selectedPermission.slug;

  // 2. If slug changed and not yet confirmed, show the warning modal
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
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
    }
    toast.success("Permission updated");
    setOpenEdit(false);
    setOpenSlugConfirm(false); // Close warning if open
    fetchPermissions();
  } catch (err: any) {
    toast.error(err.message);
  } finally { setSaving(false); }
};

  const handleDelete = async () => {
    if (!selectedPermission) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/permissions/${selectedPermission._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPermissions(prev => prev.filter(p => p._id !== selectedPermission._id));
      toast.success("Permission removed");
      setOpenDelete(false);
      fetchPermissions();
    } catch {
      toast.error("Delete failed");
    } finally { setIsDeleting(false); }
  };

  if (!isReady) return null;

  return (
    <>
      <div className="border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900 rounded-xl">
        {/* Step 1: Wrap in overflow-x-auto */}
        <div className="max-w-full overflow-x-auto">
          {/* Step 2: Force a minimum width to trigger the scroll on small screens */}
          <div className="min-w-[1200px]"> 
            <CommonReportTable
             data={permissions}
              columns={columns}
              loading={loading}
             currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
             onRowClick={handleView}
             
             onView={handleView}
             onEdit={canEdit ? handleEdit : undefined}
onDelete={
  canDelete
    ? (p) => {
        setSelectedPermission(p);
        setOpenDelete(true);
      }
    : undefined
}
            />
          </div>
        </div>
      </div>

     {/* ================= VIEW MODAL ================= */}
      <ViewModal
        isOpen={openView}
        onClose={() => setOpenView(false)}
        title="Permission Details"
        size="sm"
        
      >
        <div className="text-[13px] py-1 max-w-md mx-auto">
          {/* ================= STACKED CONTENT ================= */}
          <div className="flex flex-col gap-y-6">
            
            {/* ================= IDENTITY & ACCESS ================= */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
               Permissions 
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Permission Name</span>
                <span className="font-medium capitalize text-right">{selectedPermission?.name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Slug</span>
                <span className="font-mono text-right text-gray-700 dark:text-gray-300">
                  {selectedPermission?.slug}
                </span>
              </div>
<div className="flex justify-between gap-4">
  <span className="text-gray-500 shrink-0">Resource</span>
  <span className="font-medium text-right capitalize  tracking-tight text-gray-700 dark:text-gray-300">

    {(selectedPermission?.resourceId as ResourceRef)?.name || selectedPermission?.group || "General"}
  </span>
</div>
            </section>

            {/* ================= DESCRIPTION ================= */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                Description
              </h3>
              <div className="pt-0.5">
                <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                  {selectedPermission?.description || "No description provided."}
                </p>
              </div>
            </section>

          </div>

          {/* ================= FOOTER: STATUS ================= */}
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-gray-400">
               Status
            </span>
            <Badge color={selectedPermission?.status === "active" ? "success" : "default"}>
              <span className="capitalize">{selectedPermission?.status || "active"}</span>
            </Badge>
          </div>
        </div>
      </ViewModal>
      {/* ================= EDIT MODAL ================= */}
      {/* --- EDIT MODAL --- */}
     <EditModal
  isOpen={openEdit}
  onClose={() => setOpenEdit(false)}
  title="Edit Permission"
  loading={saving}
  onSubmit={handleUpdate}
>
  {editData && (
    <div className="max-h-[75vh] overflow-y-auto p-1 space-y-5 custom-scrollbar">
      <ComponentCard 
        title="" 
        className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          {/* 1. Permission Name */}
          <div>
            <Label>Permission</Label>
            <Input
              placeholder="e.g. Create Brand"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            />
          </div>

          {/* 🟢 CHANGED: Resources Input replaced with SearchableSelect */}
         {/* Resource SearchableSelect */}
<div>
  <Label>Resource</Label>
  <SearchableSelect
    options={resourceOptions}
    /* editData.resourceId is already a string because of the EditFormData interface override */
    value={editData.resourceId || ""} 
    onChange={(val) => {
      setEditData({ 
        ...editData, 
        resourceId: val,
        group: "" 
      });
    }}
    placeholder="Select Resource"
  />
</div>

          {/* 3. Permission Slug */}
          <div>
            <Label>Permission Slug</Label>
            <Input
              className="font-mono text-sm"
              value={editData.slug}
              onChange={(e) => setEditData({ ...editData, slug: e.target.value })}
            />
          </div>

          {/* 4. Status */}
          <div>
            <Label>Status</Label>
            <Select
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" }
              ]}
              value={editData.status}
              onChange={(val) => setEditData({ ...editData, status: val as any })}
            />
          </div>

          {/* 5. Description */}
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Input
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            />
          </div>
        </div>
      </ComponentCard>
    </div>
  )}
</EditModal>

      <ConfirmDeleteModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
        loading={isDeleting}
        description="This permission defines access to a system resource. Deactivating it will remove this capability from all associated roles and may disable related system features."
      />
      <ConfirmDeleteModal
  isOpen={openSlugConfirm}
  onClose={() => setOpenSlugConfirm(false)}
  onConfirm={() => handleUpdate(true)} // Pass 'true' to bypass the check
  loading={saving}
  title="Warning: Slug Change Detected"
  description="Changing this slug may break features in the application code that rely on the old name. Are you sure you want to change it?"
/>
    </>
  );
}