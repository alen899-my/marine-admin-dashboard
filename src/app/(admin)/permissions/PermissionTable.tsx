"use client";

import { useCallback, useEffect, useState, useMemo,Dispatch,
  SetStateAction,
  useRef, } from "react";
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
import ModalBasedAlerts from "@/components/example/ModalExample/ModalBasedAlerts"
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

interface EditFormData extends Omit<Permission, "_id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"> {
  resourceId?: string; 
}

interface PermissionTableProps {
  refresh: number;
  search: string;
  status: string;
  module: string;
   setTotalCount?: Dispatch<SetStateAction<number>>;
 setResourceOptions: Dispatch<SetStateAction<{ id: string; name: string }[]>>; // Added this
  resourceOptions: { id: string; name: string }[];
}
export default function PermissionTable({
  refresh,
  search,
  status,
  module,
  setTotalCount,resourceOptions,setResourceOptions
}: PermissionTableProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  
  const [loading, setLoading] = useState(true);
 
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
  const prevFiltersRef = useRef({ search, status, module });
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


const selectOptions = useMemo(() => 
    resourceOptions.map(m => ({ value: m.id, label: m.name })), 
  [resourceOptions]);

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
const fetchPermissions = useCallback(async () => {
  const controller = new AbortController();

  try {
    setLoading(true);
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: "20",
      search: search || "",
      status: status || "all",
      resource: module || "",
      // ✅ Add this line to force the browser to fetch fresh data
      t: refresh.toString() 
    });

    const res = await fetch(`/api/permissions/all-permission?${params.toString()}`, {
      signal: controller.signal,
      // ✅ Explicitly tell the browser not to cache
      cache: 'no-store' 
    });

    if (!res.ok) throw new Error();
    const result = await res.json();
    
    setPermissions(result.data || []);

    // Sync resources to parent
    if (result.resources && Array.isArray(result.resources)) {
      const formattedResources = result.resources.map((r: any) => ({
        id: r._id,
        name: r.name
      }));
      
      setResourceOptions(prev => {
        if (JSON.stringify(prev) === JSON.stringify(formattedResources)) return prev;
        return formattedResources;
      });
    }
    
    if (setTotalCount && typeof result.pagination?.total === 'number') {
      setTotalCount(result.pagination.total);
    }

    setTotalPages(result.pagination?.totalPages || 1);

  } catch (err: any) {
    if (err.name !== 'AbortError') {
      toast.error("Failed to load permissions");
    }
  } finally {
    setLoading(false);
  }

  return () => controller.abort();
  // ✅ Ensure refresh is here!
}, [currentPage, search, status, module, setTotalCount, setResourceOptions, refresh]); 

useEffect(() => {
  if (!isReady) return;

  // 1. Detect if the actual filter values changed since the last render
  const filtersChanged =
    prevFiltersRef.current.search !== search ||
    prevFiltersRef.current.status !== status ||
    prevFiltersRef.current.module !== module;

  // 2. If filters changed, reset to page 1
  if (filtersChanged) {
    // Update ref immediately with the new values
    prevFiltersRef.current = { search, status, module };
    
    if (currentPage !== 1) {
      setCurrentPage(1);
      return; // Stop here; the currentPage change will re-trigger this effect
    }
  }

  // 3. Fetch data for the current page (either we are on page 1 or user clicked Next/Prev)
  fetchPermissions();

}, [refresh, search, status, module, fetchPermissions, currentPage, isReady]);

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

  // 1️⃣ Detect slug change
  const isSlugChanged = editData.slug !== selectedPermission.slug;

  // 2️⃣ Ask confirmation if slug changed
  if (isSlugChanged && !force) {
    setOpenSlugConfirm(true);
    return;
  }

  setSaving(true);

  try {
    const res = await fetch(
      `/api/permissions/${selectedPermission._id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      }
    );

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || "Update failed");
    }

    // ✅ 3️⃣ INSTANT UI UPDATE (optimistic replace)
    setPermissions(prev =>
      prev.map(p =>
        p._id === selectedPermission._id ? result.data : p
      )
    );

    toast.success("Permission updated");

    // ✅ 4️⃣ Clean close
    setOpenEdit(false);
    setOpenSlugConfirm(false);
    setSelectedPermission(null);

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
    const res = await fetch(
      `/api/permissions/${selectedPermission._id}`,
      { method: "DELETE" }
    );

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || "Delete failed");
    }

    // ✅ INSTANT UI UPDATE (optimistic remove)
    setPermissions(prev =>
      prev.filter(p => p._id !== selectedPermission._id)
    );

    // ✅ Update total count if provided
    setTotalCount?.(count => Math.max(count - 1, 0));

    toast.success("Permission removed");

    // ✅ Clean close
    setOpenDelete(false);
    setSelectedPermission(null);

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
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ">
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

<div>
  <Label>Resource</Label>
  <SearchableSelect
   options={selectOptions}
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
   <ConfirmModal
  isOpen={openSlugConfirm}
  onClose={() => setOpenSlugConfirm(false)}
  onConfirm={() => handleUpdate(true)} // Force update after warning
  loading={saving}
  variant="warning"
  title="Critical: Slug Change"
  confirmLabel="Update Anyway"
  description="Changing the slug will break any code-level permission checks (e.g., can('old.slug')). This action is discouraged unless you are updating the source code accordingly."
/>
    </>
  );
}