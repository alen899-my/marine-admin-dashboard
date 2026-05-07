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
  status:
  | "draft"
  | "submitted"
  | "hr_review"
  | "shortlisted"
  | "interview_scheduled"
  | "interview_completed"
  | "selected"
  | "offer_sea_issued"
  | "accepted"
  | "onboarding_ready"
  | "onboarded"
  | "rejected";
  positionApplied?: string;
  jobTitle?: string | null;
  dateOfAvailability?: string;
  cellPhone?: string;
  createdAt: string;
  company: string;
  companyName?: string;
}

interface JobTableProps {
  data: Application[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isSuperAdmin?: boolean;
}

const statusMap: Record<
  string,
  {
    color: "slate" | "sky" | "indigo" | "purple" | "cyan" | "teal" | "emerald" | "lime" | "green" | "gray" | "rose";
    label: string;
  }
> = {
  draft:               { color: "slate",   label: "Draft" },
  submitted:           { color: "sky",     label: "Submitted" },
  hr_review:           { color: "indigo",  label: "HR Review" },
  shortlisted:         { color: "purple",  label: "Shortlisted" },
  interview_scheduled: { color: "cyan",    label: "Interview Scheduled" },
  interview_completed: { color: "teal",    label: "Interview Completed" },
  selected:            { color: "emerald", label: "Selected" },
  offer_sea_issued:    { color: "lime",    label: "Offer/SEA Issued" },
  accepted:            { color: "green",   label: "Accepted" },
  onboarding_ready:    { color: "green",   label: "Onboarding Ready" },
  onboarded:           { color: "green",   label: "Onboarded" },
  rejected:            { color: "rose",    label: "Rejected" },
};

const formatDateOnly = (date?: string) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function JobTable({
  data,
  pagination,
  isSuperAdmin = false,
}: JobTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { can, isReady } = useAuthorization();
  const canEdit = can("candidates.edit");
  const canDelete = can("candidates.delete");

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
      header: "Candidate ",
      render: (a: Application) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {a.firstName} {a.lastName}
          </span>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            <span>{a.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Applied Position & Rank",
      render: (a: Application) => (
        <div className="flex flex-col gap-1 text-xs">
          <span className="text-gray-900 dark:text-white font-medium">
            {a.jobTitle || a.positionApplied || "Not specified"}
          </span>
          <span className="text-gray-500">{a.rank || "N/A"}</span>
        </div>
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            header: "Company",
            render: (a: Application) => (
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {a.companyName || "-"}
              </span>
            ),
          },
        ]
      : []),
    {
      header: "Available on",
      render: (a: Application) => (
        <div className="flex flex-col gap-1 text-xs min-w-[140px]">
          <div className="grid grid-cols-[70px_1fr] items-center">
            <span className="text-gray-700 dark:text-gray-300 font-medium text-right sm:text-left">
              {a.dateOfAvailability
                ? formatDateOnly(a.dateOfAvailability)
                : "Immediate"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Phone Number",
      render: (a: Application) => (
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {a.cellPhone}
        </span>
      ),
    },
    {
      header: "Status",
      render: (a: Application) => {
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
          <div className="min-w-[1500px]">
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
              onRowClick={(a: Application) =>
                router.push(`/jobs/view/${a._id}`)
              }
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
        description="Are you sure you want to delete this candidate application? This action cannot be undone."
      />
    </>
  );
}
