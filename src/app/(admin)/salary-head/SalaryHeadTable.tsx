"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthorization } from "@/hooks/useAuthorization";
import Badge from "@/components/ui/badge/Badge";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import EditModal from "@/components/common/EditModal";
import ViewModal from "@/components/common/ViewModal";
import CommonReportTable from "@/components/tables/CommonReportTable";
import SalaryHeadFormFields from "@/components/salary-head/SalaryHeadFormFields";
import {
  SalaryHeadRecord,
  createEmptySalaryHeadForm,
  toSalaryHeadFormValues,
  toSalaryHeadPayload,
} from "@/lib/salaryHead";
import { salaryHeadSchema } from "@/lib/validations/salaryHeadSchema";
import { formatCurrency } from "@/lib/formatCurrency";

interface SalaryHeadTableProps {
  data: SalaryHeadRecord[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
  currencyCode?: string;
  isSuperAdmin: boolean;
  companyOptions: { value: string; label: string }[];
}

// Helper function that uses formatCurrency for consistent currency display
const formatAmountWithCurrency = (value?: number, currency?: string) =>
  formatCurrency(value ?? 0, currency);

const formatDate = (value?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function SalaryHeadTable({
  data,
  pagination,
  currencyCode = "USD",
  isSuperAdmin,
  companyOptions,
}: SalaryHeadTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can, isReady } = useAuthorization();

  const canEdit = can("salary.head.edit");
  const canDelete = can("salary.head.delete");

  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [selectedSalaryHead, setSelectedSalaryHead] =
    useState<SalaryHeadRecord | null>(null);
  const [editData, setEditData] = useState(createEmptySalaryHeadForm());

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  const columns = [
    {
      header: "S.No",
      render: (_: SalaryHeadRecord, index: number) =>
        (pagination.page - 1) * pagination.limit + index + 1,
    },
    ...(isSuperAdmin
      ? [
          {
            header: "Company",
            render: (salaryHead: SalaryHeadRecord) => (
              <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                {typeof salaryHead.companyId === "object"
                  ? (salaryHead.companyId as any)?.name || "N/A"
                  : "N/A"}
              </span>
            ),
          },
        ]
      : []),
    {
      header: "Salary Head",
      render: (salaryHead: SalaryHeadRecord) => (
        <div className="min-w-[220px]">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {salaryHead.title}
          </p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {salaryHead.description}
          </p>
        </div>
      ),
    },
    {
      header: "Period",
      render: (salaryHead: SalaryHeadRecord) => (
        <div className="min-w-[180px] text-sm text-gray-700 dark:text-gray-300">
          <p>{formatDate(salaryHead.periodFrom)}</p>
          <p className=" text-sm text-gray-700 dark:text-gray-300 mt-1">
            to {formatDate(salaryHead.periodTo)}
          </p>
        </div>
      ),
    },
    // {
    //   header: "Allowance / Deductions",
    //   render: (salaryHead: SalaryHeadRecord) => (
    //     <div className="min-w-[180px]">
    //       <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
    //         Allowance:{" "}
    //         {formatAmountWithCurrency(salaryHead.totalAllowance, currencyCode)}
    //       </p>
    //       <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">
    //         Deduction:{" "}
    //         {formatAmountWithCurrency(salaryHead.totalDeductions, currencyCode)}
    //       </p>
    //     </div>
    //   ),
    // },
    {
      header: "Status",
      render: (salaryHead: SalaryHeadRecord) => (
        <Badge color={salaryHead.status === "active" ? "success" : "error"}>
          {salaryHead.status === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const handleEdit = (salaryHead: SalaryHeadRecord) => {
    setSelectedSalaryHead(salaryHead);
    setEditData(toSalaryHeadFormValues(salaryHead));
    setErrors({});
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!selectedSalaryHead) return;

    setErrors({});

    const payload = toSalaryHeadPayload(editData);
    const validation = salaryHeadSchema.validate(payload, {
      abortEarly: false,
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
      const res = await fetch(`/api/salary-head/${selectedSalaryHead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setErrors({ title: data.error });
        }
        throw new Error(data?.error || "Update failed");
      }

      toast.success("Salary head updated");
      setOpenEdit(false);
      router.refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSalaryHead) return;

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/salary-head/${selectedSalaryHead._id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Delete failed");

      toast.success("Salary head removed");
      setOpenDelete(false);
      setSelectedSalaryHead(null);
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
              onRowClick={(salaryHead) => {
                setSelectedSalaryHead(salaryHead);
                setOpenView(true);
              }}
              onView={(salaryHead) => {
                setSelectedSalaryHead(salaryHead);
                setOpenView(true);
              }}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={
                canDelete
                  ? (salaryHead) => {
                      setSelectedSalaryHead(salaryHead);
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
        title="Salary Head Details"
      >
        {selectedSalaryHead && (
          <div className="space-y-5">
            <section className="space-y-2">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b pb-1">
                Details
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Title</span>
                <span className="font-medium text-right">
                  {selectedSalaryHead.title}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Status</span>
                <Badge
                  color={
                    selectedSalaryHead.status === "active" ? "success" : "error"
                  }
                >
                  {selectedSalaryHead.status === "active"
                    ? "Active"
                    : "Inactive"}
                </Badge>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Company</span>
                <span className="font-medium text-right">
                  {typeof selectedSalaryHead.companyId === "object"
                    ? (selectedSalaryHead.companyId as any)?.name || "N/A"
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Period</span>
                <span className="font-medium text-right">
                  {formatDate(selectedSalaryHead.periodFrom)} to{" "}
                  {formatDate(selectedSalaryHead.periodTo)}
                </span>
              </div>
              <div className="space-y-1 pt-2">
                <span className="text-gray-500 block">Description</span>
                <p className="font-medium text-sm whitespace-pre-line">
                  {selectedSalaryHead.description}
                </p>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b pb-1">
                Allowances
              </h3>
              <div className="space-y-1.5">
                {selectedSalaryHead.allowances.length > 0 ? (
                  selectedSalaryHead.allowances.map((allowance, index) => (
                    <div
                      key={`${allowance.label}-${index}`}
                      className="flex justify-between gap-4"
                    >
                      <span className="text-gray-500 shrink-0">
                        {allowance.label}
                      </span>
                      <span className="font-medium text-right">
                        {allowance.type === "percent"
                          ? `${Number(allowance.value).toFixed(2)}%`
                          : formatAmountWithCurrency(
                              allowance.value,
                              currencyCode,
                            )}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No allowances added.</p>
                )}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b pb-1">
                Deductions
              </h3>
              <div className="space-y-1.5">
                {selectedSalaryHead.deductions.length > 0 ? (
                  selectedSalaryHead.deductions.map((deduction, index) => (
                    <div
                      key={`${deduction.label}-${index}`}
                      className="flex justify-between gap-4"
                    >
                      <span className="text-gray-500 shrink-0">
                        {deduction.label}
                      </span>
                      <span className="font-medium text-right">
                        {deduction.type === "percent"
                          ? `${Number(deduction.value).toFixed(2)}%`
                          : formatAmountWithCurrency(
                              deduction.value,
                              currencyCode,
                            )}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No deductions added.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </ViewModal>

      <EditModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit Salary Head"
        loading={saving}
        onSubmit={handleUpdate}
      >
        <div className="max-h-[75vh] overflow-y-auto p-1 space-y-5 custom-scrollbar">
          <SalaryHeadFormFields
            formData={editData}
            errors={errors}
            disabled={saving}
            currencyCode={currencyCode}
            isSuperAdmin={isSuperAdmin}
            companyOptions={companyOptions}
            onFieldChange={(field, value) => {
              setEditData((prev) => ({ ...prev, [field]: value }));
              setErrors((prev) => ({ ...prev, [String(field)]: "" }));
            }}
            onAllowanceChange={(index, field, value) => {
              setEditData((prev) => {
                const allowances = [...prev.allowances];
                allowances[index] = { ...allowances[index], [field]: value };
                return { ...prev, allowances };
              });
              setErrors((prev) => ({
                ...prev,
                [`allowances.${index}.${field}`]: "",
              }));
            }}
            onDeductionChange={(index, field, value) => {
              setEditData((prev) => {
                const deductions = [...prev.deductions];
                deductions[index] = { ...deductions[index], [field]: value };
                return { ...prev, deductions };
              });
              setErrors((prev) => ({
                ...prev,
                [`deductions.${index}.${field}`]: "",
              }));
            }}
            onAddAllowance={() =>
              setEditData((prev) => ({
                ...prev,
                allowances: [...prev.allowances, { label: "", value: "", type: "amount" }],
              }))
            }
            onAddDeduction={() =>
              setEditData((prev) => ({
                ...prev,
                deductions: [...prev.deductions, { label: "", value: "", type: "amount" }],
              }))
            }
            onRemoveAllowance={(index) =>
              setEditData((prev) => ({
                ...prev,
                allowances: prev.allowances.filter((_, i) => i !== index),
              }))
            }
            onRemoveDeduction={(index) =>
              setEditData((prev) => ({
                ...prev,
                deductions: prev.deductions.filter((_, i) => i !== index),
              }))
            }
          />
        </div>
      </EditModal>

      <ConfirmDeleteModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
        loading={isDeleting}
        description="This salary head will be marked as inactive and removed from active lists to preserve existing records."
      />
    </>
  );
}
