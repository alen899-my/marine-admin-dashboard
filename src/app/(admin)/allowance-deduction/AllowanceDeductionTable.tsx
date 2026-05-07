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
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import { allowanceDeductionSchema } from "@/lib/validations/allowanceDeductionSchema";
import {
  toAllowanceDeductionPayload,
  toAllowanceDeductionFormValues,
  AllowanceDeductionRecord,
  AllowanceDeductionFormValues,
} from "@/lib/allowanceDeduction";

interface AllowanceDeductionTableProps {
  data: AllowanceDeductionRecord[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

function descriptionText(description?: string) {
  const trimmed = description?.trim();
  return trimmed || "-";
}

export default function AllowanceDeductionTable({
  data,
  pagination,
}: AllowanceDeductionTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can, isReady } = useAuthorization();

  const canEdit = can("allowance.deduction.edit");
  const canDelete = can("allowance.deduction.delete");

  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [selectedItem, setSelectedItem] =
    useState<AllowanceDeductionRecord | null>(null);
  const [editData, setEditData] =
    useState<AllowanceDeductionFormValues | null>(null);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  const columns = [
    {
      header: "S.No",
      render: (_: AllowanceDeductionRecord, index: number) =>
        (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      header: "Name",
      render: (item: AllowanceDeductionRecord) => (
        <span className="font-semibold text-gray-900 dark:text-white">
          {item.name}
        </span>
      ),
    },
    {
      header: "Code",
      render: (item: AllowanceDeductionRecord) => (
        <span className="font-medium text-gray-700 dark:text-gray-200">
          {item.code}
        </span>
      ),
    },
    {
      header: "Type",
      render: (item: AllowanceDeductionRecord) => (
        <Badge
          color={item.type === "allowance" ? "success" : "error"}
          shape="rounded"
        >
          {item.type === "allowance" ? "Allowance" : "Deduction"}
        </Badge>
      ),
    },
    {
      header: "Description",
      render: (item: AllowanceDeductionRecord) => (
        <span className="block max-w-[260px] truncate text-gray-600 dark:text-gray-300">
          {descriptionText(item.description)}
        </span>
      ),
    },
    {
      header: "Status",
      render: (item: AllowanceDeductionRecord) => (
        <Badge color={item.status === "active" ? "success" : "error"}>
          {item.status === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const handleEdit = (item: AllowanceDeductionRecord) => {
    setSelectedItem(item);
    setEditData(toAllowanceDeductionFormValues(item));
    setErrors({});
    setOpenEdit(true);
  };

  const handleFieldChange = (
    field: keyof AllowanceDeductionFormValues,
    value: string,
  ) => {
    setEditData((prev) => (prev ? { ...prev, [field]: value } : prev));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleUpdate = async () => {
    if (!selectedItem || !editData) return;
    setErrors({});

    const payload = toAllowanceDeductionPayload(editData);
    const validation = allowanceDeductionSchema.validate(payload, {
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
      const res = await fetch(`/api/allowance-deduction/${selectedItem._id}`, {
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

      toast.success("Allowance/Deduction updated");
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
      const res = await fetch(`/api/allowance-deduction/${selectedItem._id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Delete failed");

      toast.success("Allowance/Deduction removed");
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
          <div className="min-w-[1200px]">
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
        title="Allowance / Deduction Details"
      >
        {selectedItem && (
          <div className="space-y-5">
            <section className="space-y-2">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b pb-1">
                Details
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Name</span>
                <span className="font-medium text-right">
                  {selectedItem.name}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Code</span>
                <span className="font-medium text-right">
                  {selectedItem.code}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Type</span>
                <span className="text-right">
                  <Badge
                    color={selectedItem.type === "allowance" ? "success" : "error"}
                    shape="square"
                  >
                    {selectedItem.type === "allowance" ? "Allowance" : "Deduction"}
                  </Badge>
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Status</span>
                <span className="text-right">
                  <Badge
                    color={selectedItem.status === "active" ? "success" : "error"}
                  >
                    {selectedItem.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500">Description</span>
                <p className="font-medium text-gray-900 dark:text-white whitespace-pre-line break-words">
                  {descriptionText(selectedItem.description)}
                </p>
              </div>
            </section>
          </div>
        )}
      </ViewModal>

      <EditModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit Allowance / Deduction"
        loading={saving}
        onSubmit={handleUpdate}
      >
        <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {editData && (
            <ComponentCard title="Master Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                      { value: "allowance", label: "Allowance" },
                      { value: "deduction", label: "Deduction" },
                    ]}
                    value={editData.type || "allowance"}
                    onChange={(val) => handleFieldChange("type", val)}
                    error={!!errors.type}
                    hint={errors.type}
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

                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <TextArea
                    rows={4}
                    value={editData.description || ""}
                    onChange={(e) =>
                      handleFieldChange("description", e.target.value)
                    }
                    error={!!errors.description}
                    hint={errors.description}
                  />
                </div>
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
        description="This will permanently remove the master from the system."
      />
    </>
  );
}
