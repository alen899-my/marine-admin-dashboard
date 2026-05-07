"use client";

import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import EditModal from "@/components/common/EditModal";
import ViewModal from "@/components/common/ViewModal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import CommonReportTable from "@/components/tables/CommonReportTable";
import Badge from "@/components/ui/badge/Badge";
import { useAuthorization } from "@/hooks/useAuthorization";
import { UserGuideGroup } from "@/types/userGuide";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

interface Props {
  data: UserGuideGroup[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function UserGuideGroupTable({ data, pagination }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can, isReady } = useAuthorization();
  const canEdit = can("userguide.edit");
  const canDelete = can("userguide.delete");

  const [selectedGroup, setSelectedGroup] = useState<UserGuideGroup | null>(null);
  const [editData, setEditData] = useState<{
    name: string;
    sortOrder: number;
    status: "active" | "inactive";
  } | null>(null);
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isReady) return null;

  const columns = [
    {
      header: "S.No",
      render: (_row: UserGuideGroup, index: number) =>
        (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      header: "Group Name",
      render: (row: UserGuideGroup) => row.name,
    },
    {
      header: "Order",
      render: (row: UserGuideGroup) => row.sortOrder,
    },
    {
      header: "Status",
      render: (row: UserGuideGroup) => (
        <Badge color={row.status === "active" ? "success" : "error"}>
          {row.status === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handleUpdate = async () => {
    if (!selectedGroup || !editData) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/user-guide-groups/${selectedGroup._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to update group");

      toast.success("Group updated successfully");
      setOpenEdit(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update group");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedGroup) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/user-guide-groups/${selectedGroup._id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to delete group");

      toast.success("Group deleted successfully");
      setOpenDelete(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete group");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[900px]">
            <CommonReportTable
              data={data}
              columns={columns}
              loading={false}
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              onRowClick={(row) => {
                setSelectedGroup(row);
                setOpenView(true);
              }}
              onView={(row) => {
                setSelectedGroup(row);
                setOpenView(true);
              }}
              onEdit={
                canEdit
                  ? (row) => {
                      setSelectedGroup(row);
                      setEditData({
                        name: row.name,
                        sortOrder: row.sortOrder,
                        status: row.status,
                      });
                      setOpenEdit(true);
                    }
                  : undefined
              }
              onDelete={
                canDelete
                  ? (row) => {
                      setSelectedGroup(row);
                      setOpenDelete(true);
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </div>

      <ViewModal
        isOpen={openView}
        onClose={() => setOpenView(false)}
        title="User Guide Group Details"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Name</span>
            <span className="font-semibold">{selectedGroup?.name}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Display Order</span>
            <span className="font-semibold">{selectedGroup?.sortOrder}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <Badge color={selectedGroup?.status === "active" ? "success" : "error"}>
              {selectedGroup?.status}
            </Badge>
          </div>
        </div>
      </ViewModal>

      <EditModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit User Guide Group"
        loading={saving}
        onSubmit={handleUpdate}
      >
        {editData && (
          <div className="space-y-5">
            <div>
              <Label>Group Name</Label>
              <Input
                value={editData.name}
                onChange={(event) =>
                  setEditData((prev) =>
                    prev ? { ...prev, name: event.target.value } : prev,
                  )
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  min="0"
                  value={editData.sortOrder}
                  onChange={(event) =>
                    setEditData((prev) =>
                      prev
                        ? { ...prev, sortOrder: Number(event.target.value || 0) }
                        : prev,
                    )
                  }
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                  value={editData.status}
                  onChange={(value) =>
                    setEditData((prev) =>
                      prev ? { ...prev, status: value as "active" | "inactive" } : prev,
                    )
                  }
                />
              </div>
            </div>
          </div>
        )}
      </EditModal>

      <ConfirmDeleteModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Group"
        description={`Are you sure you want to delete "${selectedGroup?.name || "this group"}"?`}
      />
    </>
  );
}
