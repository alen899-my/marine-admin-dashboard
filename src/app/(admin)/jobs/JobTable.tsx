"use client";

import Badge from "@/components/ui/badge/Badge";
import CommonReportTable from "@/components/tables/CommonReportTable";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

interface Application {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  rank: string;
  nationality: string;
  status: "draft" | "submitted" | "reviewing" | "approved" | "rejected" | "on_hold" | "archived";
  positionApplied?: string;
  dateOfAvailability?: string;
  cellPhone?: string;
  createdAt: string;
  company: string;
}

interface JobTableProps {
  data: Application[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function JobTable({ data, pagination }: JobTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { can, isReady } = useAuthorization();
  const canEdit = can("jobs.edit");
  const canDelete = can("jobs.delete");

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  const handleActionDelete = async () => {
    if (!selectedId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/applications/${selectedId}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to delete");
      }

      toast.success("Application deleted successfully");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    } finally {
      setIsDeleting(false);
      setOpenDelete(false);
      setSelectedId(null);
    }
  };

  const columns = [
    {
      header: "S.No",
      render: (_: any, index: number) =>
        (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      header: "Candidate Name",
      render: (a: Application) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {a.lastName}, {a.firstName}
          </span>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            <span>{a.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Position & Rank",
      render: (a: Application) => (
        <div className="flex flex-col gap-1 text-xs">
          <span className="text-gray-900 dark:text-white font-medium">
            {a.rank || "N/A"}
          </span>
          <span className="text-gray-500">
            {a.positionApplied || "Not specified"}
          </span>
        </div>
      ),
    },
    {
      header: "Details",
      render: (a: Application) => (
        <div className="flex flex-col gap-1 text-xs min-w-[140px]">
          <div className="grid grid-cols-[70px_1fr] items-center">
            <span className="text-gray-400">Nationality</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium text-right sm:text-left">
              {a.nationality || "-"}
            </span>
          </div>
          <div className="grid grid-cols-[70px_1fr] items-center">
            <span className="text-gray-400">Available</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium text-right sm:text-left">
              {a.dateOfAvailability
                ? new Date(a.dateOfAvailability).toLocaleDateString()
                : "Immediate"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Applied Date",
      render: (a: Application) => (
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {new Date(a.createdAt).toLocaleDateString("en-GB")}
        </span>
      ),
    },
    {
      header: "Status",
      render: (a: Application) => {
        const statusMap: Record<string, { color: any; label: string }> = {
          draft: { color: "default", label: "Draft" },
          submitted: { color: "info", label: "Submitted" },
          reviewing: { color: "warning", label: "Reviewing" },
          approved: { color: "success", label: "Approved" },
          rejected: { color: "error", label: "Rejected" },
          on_hold: { color: "warning", label: "On Hold" },
          archived: { color: "default", label: "Archived" },
        };
        const config = statusMap[a.status] ?? statusMap.draft;
        return <Badge color={config.color}>{config.label}</Badge>;
      },
    },
  ];

  if (!isReady) return null;

  return (
    <>
      <div className="border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900 rounded-xl">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1300px]">
            <CommonReportTable
              data={data}
              columns={columns}
              loading={false}
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              onView={(a: Application) => router.push(`/jobs/view/${a._id}`)}
              onEdit={
                canEdit
                  ? (a: Application) => router.push(`/jobs/edit/${a._id}`)
                  : undefined
              }
              onDelete={
                canDelete
                  ? (a: Application) => {
                    setSelectedId(a._id);
                    setOpenDelete(true);
                  }
                  : undefined
              }
              onRowClick={(a: Application) => router.push(`/jobs/view/${a._id}`)}
            />
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={openDelete}
        onClose={() => {
          setOpenDelete(false);
          setSelectedId(null);
        }}
        onConfirm={handleActionDelete}
        loading={isDeleting}
        title="Delete Application"
        description="Are you sure you want to delete this crew application? This action cannot be undone."
      />
    </>
  );
}