"use client";

import { useCallback, useEffect, useState, Dispatch,
  SetStateAction, } from "react";
import { toast } from "react-toastify";
import { useAuthorization } from "@/hooks/useAuthorization";

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

interface Resource {
  _id: string;
  name: string;
  status: "active" | "inactive";
  createdAt?: string;
}

interface ResourceTableProps {
  refresh: number;
  search: string;
  status: string; 
   setTotalCount?: Dispatch<SetStateAction<number>>;
}

export default function ResourceTable({ refresh, search, status,setTotalCount }: ResourceTableProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Selection
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [editData, setEditData] = useState<{ name: string; status: "active" | "inactive" } | null>(null);

  const { can, isReady } = useAuthorization();
  const canEdit = can("resource.edit");
  const canDelete = can("resource.delete");

  /* ================= COLUMNS ================= */
  const columns = [
    {
      header: "S.No",
      render: (_: Resource, index: number) => (currentPage - 1) * 20 + index + 1,
    },
    {
      header: "Resource Name",
      render: (r: Resource) => (
        <span className="text-sm font-medium capitalize text-gray-900 dark:text-white ">
          {r.name}
        </span>
      ),
    },
    {
      header: "Status",
      render: (r: Resource) => (
        <Badge color={r.status === "active" ? "success" : "error"}>
          {r.status === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  /* ================= FETCH (UPDATED FOR SERVER-SIDE) ================= */
  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      // Pass pagination, search, and status to the API
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        search: search,
        status: status
      });

      const res = await fetch(`/api/resources?${queryParams.toString()}`);
      if (!res.ok) throw new Error();
      const result = await res.json();
      
      setResources(result.data || []);
      if (setTotalCount) {
          setTotalCount(result.pagination?.total || result.data?.length || 0);
        }
      setTotalPages(result.pagination?.totalPages || 1); 
    } catch (err) {
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, status,setTotalCount]); // Dependencies updated

  useEffect(() => {
  if (currentPage !== 1) {
    setCurrentPage(1);
  }
}, [search, status]);
useEffect(() => {
  fetchResources();
}, [currentPage, refresh, search, status]);


  const handleView = (r: Resource) => {
  setSelectedResource(r);
  setOpenView(true);
};
  /* ================= ACTIONS ================= */
  const handleEdit = (r: Resource) => {
    setSelectedResource(r);
    setEditData({ name: r.name, status: r.status });
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!selectedResource || !editData) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/resources/${selectedResource._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error();
      toast.success("Resource updated");
      setOpenEdit(false);
      fetchResources();
    } catch {
      toast.error("Update failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selectedResource) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/resources/${selectedResource._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Resource removed");
      setOpenDelete(false);
      fetchResources();
    } catch {
      toast.error("Delete failed");
    } finally { setIsDeleting(false); }
  };

  if (!isReady) return null;

  return (
    <>
      <div className="border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900 rounded-xl overflow-hidden">
         <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1200px]"> 
        <CommonReportTable
          data={resources}
          columns={columns}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
           onRowClick={handleView}
          onView={(r) => { setSelectedResource(r); setOpenView(true); }}
          onEdit={canEdit ? handleEdit : undefined}
          onDelete={canDelete ? (r) => {
            setSelectedResource(r);
            setOpenDelete(true);
          } : undefined}
        />
        </div>
        </div>
      </div>

      <ViewModal isOpen={openView} onClose={() => setOpenView(false)} title="Resource Details" size="sm">
        <div className="space-y-4 p-2">
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Name</span>
            <span className="font-bold">{selectedResource?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <Badge color={selectedResource?.status === "active" ? "success" : "error"}>
              {selectedResource?.status}
            </Badge>
          </div>
        </div>
      </ViewModal>

     <EditModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit Resource"
        loading={saving}
        onSubmit={handleUpdate}
      >
        {editData && (
          <div className="max-h-[75vh] overflow-y-auto p-1 space-y-5 custom-scrollbar">
            <ComponentCard
              title=""
              className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="grid grid-cols-1 md:grid-cols-1 gap-x-6 gap-y-5">
                <div className="md:col-span-1">
                  <Label>Resource Name</Label>
                  <Input
                    placeholder="e.g. Storage Unit A"
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-1">
                  <Label>Status</Label>
                  <Select
                    options={[
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ]}
                    value={editData.status}
                    onChange={(val) =>
                      setEditData({ ...editData, status: val as any })
                    }
                  />
                </div>
              </div>
            </ComponentCard>
          </div>
        )}
      </EditModal>

      <ConfirmDeleteModal description="This resource is in use by other modules. It will be marked as inactive to protect data integrity while removing it from active selection." isOpen={openDelete} onClose={() => setOpenDelete(false)} onConfirm={handleDelete} loading={isDeleting} />
    </>
  );
}