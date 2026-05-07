"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { Copy, Eye, PenBox, Trash2 } from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import CommonReportTable from "@/components/tables/CommonReportTable";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import { useAuthorization } from "@/hooks/useAuthorization";
import Button from "@/components/ui/button/Button";

interface SeaTemplateRow {
  _id: string;
  name: string;
  isDefault: boolean;
  status: string;
  primaryColor?: string;
  company?: { _id: string; name: string; logo?: string };
  sections?: any[];
  createdAt: string;
  updatedAt: string;
}

interface SeaTemplateTableProps {
  data: SeaTemplateRow[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading?: boolean;
  isSuperAdmin?: boolean;
}

export default function SeaTemplateTable({ data, pagination, loading, isSuperAdmin }: SeaTemplateTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SeaTemplateRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const { can } = useAuthorization();
  const canEdit = can("templates.edit");
  const canDuplicate = can("templates.create");
  const canDelete = can("templates.delete");
  const canView = can("templates.view");

  const handleDeleteClick = (row: SeaTemplateRow) => {
    setSelectedTemplate(row);
    setOpenDelete(true);
  };

  const handleActionDelete = async () => {
    if (!selectedTemplate) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/sea-templates/${selectedTemplate._id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        toast.success("Template deleted successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete template");
      }
    } catch {
      toast.error("Server error.");
    } finally {
      setIsDeleting(false);
      setOpenDelete(false);
      setSelectedTemplate(null);
    }
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  const handleDuplicate = async (row: SeaTemplateRow) => {
    setDuplicatingId(row._id);
    try {
      const res = await fetch(`/api/sea-templates/${row._id}/duplicate`, {
        method: "POST",
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to duplicate template");
      }
      toast.success("Template duplicated successfully");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to duplicate template");
    } finally {
      setDuplicatingId(null);
    }
  };

  const columns = [
    {
      header: "S.No",
      render: (_: any, index: number) =>
        ((pagination?.page || 1) - 1) * (pagination?.limit || 10) + index + 1,
    },
    {
      header: "Template",
      render: (row: SeaTemplateRow) => (
        <div className="flex items-center gap-3">
        
          <div className="flex flex-col">
            <span className="font-normal text-gray-900 dark:text-white">
              {row.name}
            </span>
            {row.isDefault && (
              <div className="mt-1">
                <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold border border-brand-100 dark:border-brand-500/20">
                  DEFAULT
                </span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            header: "Company",
            render: (row: SeaTemplateRow) => (
              <div className="flex items-center gap-2">
                {row.company?.logo ? (
                  <img src={row.company.logo} alt="" className="h-6 w-6 rounded bg-gray-50 dark:bg-gray-800 p-0.5 object-contain" />
                ) : (
                  <div className="h-6 w-6 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400">
                    {(row.company?.name || "C").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {row.company?.name || "—"}
                </span>
              </div>
            ),
          },
        ]
      : []),
 
    {
      header: "Status",
      render: (row: SeaTemplateRow) => (
        <Badge color={row.status === "active" ? "green" : "error"}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      ),
    },
   
  ];

  return (
    <>
      <div className="border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900 rounded-xl">
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[1100px]">
            <CommonReportTable
              data={data}
              columns={columns}
              loading={loading || false}
              currentPage={pagination?.page || 1}
              totalPages={pagination?.totalPages || 1}
              onPageChange={handlePageChange}
              onRowClick={canView ? (row: SeaTemplateRow) => router.push(`/sea-templates/${row._id}/preview`): undefined}
              renderActions={(row: SeaTemplateRow) => (
                <div className="flex gap-2 justify-start">
                  {canView && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="dark:border-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/sea-templates/${row._id}/preview`);
                      }}
                    >
                      <Eye className="h-4 w-4 text-blue-500" />
                    </Button>
                  )}
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="dark:border-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/sea-templates/${row._id}/edit`);
                      }}
                    >
                      <PenBox className="h-4 w-4 text-yellow-500" />
                    </Button>
                  )}
                  {canDuplicate && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="dark:border-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(row);
                      }}
                      disabled={duplicatingId === row._id}
                    >
                      <Copy className="h-4 w-4 text-emerald-500" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="dark:border-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(row);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              )}
            />
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={openDelete}
        onClose={() => {
          setOpenDelete(false);
          setSelectedTemplate(null);
        }}
        onConfirm={handleActionDelete}
        loading={isDeleting}
        title="Delete SEA Template"
        description={`Are you sure you want to delete the template "${selectedTemplate?.name}"? This action will permanently remove it from the system.`}
      />
    </>
  );
}
