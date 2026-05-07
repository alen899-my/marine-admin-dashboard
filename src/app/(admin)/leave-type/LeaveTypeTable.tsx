"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthorization } from "@/hooks/useAuthorization";
import Badge from "@/components/ui/badge/Badge";
import ComponentCard from "@/components/common/ComponentCard";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import EditModal from "@/components/common/EditModal";
import ViewModal from "@/components/common/ViewModal";
import CommonReportTable from "@/components/tables/CommonReportTable";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Checkbox from "@/components/form/input/Checkbox";
import Select from "@/components/form/Select";
import SearchableSelect from "@/components/form/SearchableSelect";
import { leaveTypeSchema } from "@/lib/validations/leaveTypeSchema";
import {
  toLeaveTypePayload,
  toLeaveTypeFormValues,
  LeaveTypeRecord,
  LeaveTypeFormValues,
} from "@/lib/leaveType";

interface LeaveTypeTableProps {
  data: LeaveTypeRecord[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
  isSuperAdmin?: boolean;
  companies?: { value: string; label: string }[];
}

export default function LeaveTypeTable({
  data,
  pagination,
  isSuperAdmin = false,
  companies = [],
}: LeaveTypeTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can, isReady } = useAuthorization();

  const canEdit = can("leavetype.edit");
  const canDelete = can("leavetype.delete");

  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [selectedItem, setSelectedItem] = useState<LeaveTypeRecord | null>(
    null,
  );
  const [editData, setEditData] = useState<LeaveTypeFormValues | null>(null);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  const columns = [
    {
      header: "S.No",
      render: (_: LeaveTypeRecord, index: number) =>
        (pagination.page - 1) * pagination.limit + index + 1,
    },
    ...(isSuperAdmin ? [{
      header: "Company",
      render: (item: LeaveTypeRecord) => (
        <span className="text-gray-600 dark:text-gray-400">
          {item.companyName || "-"}
        </span>
      ),
    }] : []),
    {
      header: "Name",
      render: (item: LeaveTypeRecord) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          {item.name}
        </span>
      ),
    },
    {
      header: "Code",
      render: (item: LeaveTypeRecord) => (
        <Badge color="info">{item.code}</Badge>
      ),
    },
    {
      header: "Type",
      render: (item: LeaveTypeRecord) => (
        <span className="capitalize">{item.type}</span>
      ),
    },
    {
      header: "Max Days",
      render: (item: LeaveTypeRecord) => <span>{item.maxDays}</span>,
    },
    {
      header: "Status",
      render: (item: LeaveTypeRecord) => (
        <Badge color={item.status === "active" ? "success" : "error"}>
          {item.status === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const handleEdit = (item: LeaveTypeRecord) => {
    setSelectedItem(item);
    setEditData(toLeaveTypeFormValues(item));
    setErrors({});
    setOpenEdit(true);
  };

  const handleFieldChange = (field: keyof LeaveTypeFormValues, value: any) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleUpdate = async () => {
    if (!selectedItem || !editData) return;
    setErrors({});

    const payload = toLeaveTypePayload(editData);

    const validation = leaveTypeSchema.validate(payload, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: true,
    });

    if (validation.error) {
      const nextErrors: Record<string, string> = {};
      validation.error.details.forEach((detail) => {
        nextErrors[detail.path.join(".")] = detail.message;
      });
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/leave-type/${selectedItem._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setErrors({ code: data.error });
        }
        throw new Error(data?.error || "Update failed");
      }

      toast.success("Leave type updated");
      setOpenEdit(false);
      router.refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/leave-type/${selectedItem._id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Delete failed");

      toast.success("Leave type removed");
      setOpenDelete(false);
      setSelectedItem(null);
      router.refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isReady) return null;

  return (
    <>
      <div className="border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900 rounded-xl overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[800px]">
            <CommonReportTable
              data={data}
              columns={columns}
              loading={false}
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              onRowClick={(item) => {
                setSelectedItem(item);
                setOpenView(true);
              }}
              onView={(item) => {
                setSelectedItem(item);
                setOpenView(true);
              }}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={
                canDelete
                  ? (item) => {
                      setSelectedItem(item);
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
        title="Leave Type Details"
      >
        {selectedItem && (
          <div className="space-y-5">
            <section className="space-y-2">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b pb-1">
                Details
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Company</span>
                <span className="font-medium text-right">
                  {selectedItem.companyName || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Name</span>
                <span className="font-medium text-right">
                  {selectedItem.name}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Code</span>
                <span className="text-right">
                  <Badge color="info">{selectedItem.code}</Badge>
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Type</span>
                <span className="font-medium text-right capitalize">
                  {selectedItem.type}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Maximum Days</span>
                <span className="font-medium text-right">
                  {selectedItem.maxDays}{" "}
                  {selectedItem.maxDays === 1 ? "day" : "days"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">
                  Carry Forward Allowed?
                </span>
                <span className="font-medium text-right">
                  {selectedItem.isCarryForward ? "Yes" : "No"}
                </span>
              </div>
              {selectedItem.isCarryForward && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 shrink-0">
                    Max Carry Forward
                  </span>
                  <span className="font-medium text-right">
                    {selectedItem.maxCarryForward}{" "}
                    {selectedItem.maxCarryForward === 1 ? "day" : "days"}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Status</span>
                <span className="text-right">
                  <Badge
                    color={
                      selectedItem.status === "active" ? "success" : "error"
                    }
                  >
                    {selectedItem.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </span>
              </div>
            </section>
          </div>
        )}
      </ViewModal>

      <EditModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit Leave Type"
        loading={saving}
        onSubmit={handleUpdate}
      >
        <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {editData && (
            <ComponentCard title="Leave Type Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Company - display only for superadmins */}
                {isSuperAdmin && (
                  <div className="md:col-span-1">
                    <Label>Company</Label>
                    <SearchableSelect
                      options={companies}
                      value={editData.companyId}
                      onChange={(val) => handleFieldChange("companyId", val)}
                      placeholder="Search Company..."
                      error={!!errors.companyId}
                    />
                    {errors.companyId && (
                      <p className="text-xs text-red-500 mt-1">{errors.companyId}</p>
                    )}
                  </div>
                )}

                <div className="md:col-span-1">
                  <Label>
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={editData.name || ""}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    error={!!errors.name}
                    hint={errors.name}
                  />
                </div>

                <div className="md:col-span-1">
                  <Label>
                    Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={editData.code || ""}
                    onChange={(e) =>
                      handleFieldChange("code", e.target.value.toUpperCase())
                    }
                    error={!!errors.code}
                    hint={errors.code}
                  />
                </div>

                <div className="md:col-span-1">
                  <Label>Type</Label>
                  <Select
                    options={[
                      { value: "paid", label: "Paid" },
                      { value: "unpaid", label: "Unpaid" },
                    ]}
                    value={editData.type || "paid"}
                    onChange={(val) => handleFieldChange("type", val)}
                    error={!!errors.type}
                    hint={errors.type}
                  />
                </div>

                <div className="md:col-span-1">
                  <Label>Max Days</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editData.maxDays || ""}
                    onChange={(e) =>
                      handleFieldChange("maxDays", e.target.value)
                    }
                    error={!!errors.maxDays}
                    hint={errors.maxDays}
                  />
                </div>

                <div className="md:col-span-1">
                  <Label>Status</Label>
                  <Select
                    options={[
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ]}
                    value={editData.status || "active"}
                    onChange={(val) => handleFieldChange("status", val)}
                    error={!!errors.status}
                    hint={errors.status}
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-3 py-2 border-t dark:border-white/10 mt-2">
                  <Checkbox
                    id="editIsCarryForward"
                    label="Allow Carry Forward?"
                    checked={editData.isCarryForward || false}
                    onChange={(checked) =>
                      handleFieldChange("isCarryForward", checked)
                    }
                  />
                </div>

                {editData.isCarryForward && (
                  <div className="md:col-span-1">
                    <Label>Max Carry Forward Days</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editData.maxCarryForward || ""}
                      onChange={(e) =>
                        handleFieldChange("maxCarryForward", e.target.value)
                      }
                      error={!!errors.maxCarryForward}
                      hint={errors.maxCarryForward}
                    />
                  </div>
                )}
              </div>
            </ComponentCard>
          )}
        </div>
      </EditModal>

      <ConfirmDeleteModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
        loading={isDeleting}
        description="This will permanently remove the leave type from the system."
      />
    </>
  );
}
