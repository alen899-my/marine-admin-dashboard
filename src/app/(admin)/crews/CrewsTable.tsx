"use client";

import ConfirmModal from "@/components/modal/ConfirmModal";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import Badge from "@/components/ui/badge/Badge";
import CommonReportTable from "@/components/tables/CommonReportTable";
import { useAuthorization } from "@/hooks/useAuthorization";

interface CrewRowData {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  rank?: string;
  positionApplied?: string;
  jobTitle?: string | null;
  crew?: string;
  companyName?: string;
}

interface CrewsTableProps {
  data: CrewRowData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isSuperAdmin?: boolean;
}

export default function CrewsTable({
  data,
  pagination,
  isSuperAdmin = false,
}: CrewsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can, canAny, isReady } = useAuthorization();
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<CrewRowData | null>(null);
  const [isUpdatingCrew, setIsUpdatingCrew] = useState(false);
  const canEdit = canAny(["crews.edit", "candidates.edit"]);
  const canDelete = canAny(["crews.delete", "candidates.delete"]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  const handleView = (crew: CrewRowData) => {
    router.push(`/crews/view/${crew._id}`);
  };

  const handleEdit = (crew: CrewRowData) => {
    router.push(`/crews/edit/${crew._id}`);
  };

  // const handleDelete = (crew: CrewRowData) => {
  //   setSelectedCrew(crew);
  //   setOpenDelete(true);
  // };

  // const handleConfirmDelete = async () => {
  //   if (!selectedCrew) return;

  //   setIsUpdatingCrew(true);

  //   try {
  //     const res = await fetch(`/api/crews/${selectedCrew._id}`, {
  //       method: "DELETE",
  //     });

  //     const result = await res.json();
  //     if (!res.ok || !result.success) {
  //       throw new Error(result.error || "Failed to update crew status");
  //     }

  //     toast.success("Crew removed successfully");
  //     router.refresh();
  //   } catch (error: any) {
  //     toast.error(error.message || "Failed to remove crew");
  //   } finally {
  //     setIsUpdatingCrew(false);
  //     setOpenDelete(false);
  //     setSelectedCrew(null);
  //   }
  // };

  const columns = [
    {
      header: "S.No",
      render: (_crew: CrewRowData, index: number) =>
        (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      header: "Name",
      render: (crew: CrewRowData) => (
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {`${crew.firstName || ""} ${crew.lastName || ""}`.trim() || "-"}
        </span>
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            header: "Company",
            render: (crew: CrewRowData) => (
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {crew.companyName || "-"}
              </span>
            ),
          },
        ]
      : []),
    {
      header: "Email",
      render: (crew: CrewRowData) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {crew.email || "-"}
        </span>
      ),
    },
    {
      header: "Position",
      render: (crew: CrewRowData) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {crew.jobTitle || crew.positionApplied || crew.rank || "-"}
        </span>
      ),
    },
    {
      header: "Crew Status",
      render: (crew: CrewRowData) => {
        const statusMap: Record<string, { color: string; label: string }> = {
          onboard: { color: "success", label: "Onboard" },
          vacation: { color: "blue", label: "Vacation" },
          available: { color: "emerald", label: "Available" },
          traveling: { color: "purple", label: "Traveling" },
          medical_leave: { color: "warning", label: "Medical Leave" },
          training: { color: "indigo", label: "Training" },
          inactive: { color: "light", label: "Inactive" },
          resigned: { color: "rose", label: "Resigned" },
          blacklisted: { color: "error", label: "Blacklisted" },
        };

        const status = crew.crew || "inactive";
        const config = statusMap[status] || { color: "light", label: status };

        return (
          <Badge color={config.color as any}>
            {config.label}
          </Badge>
        );
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
              onView={handleView}
              onEdit={canEdit ? handleEdit : undefined}
              // onDelete={canDelete ? handleDelete : undefined}
              // deleteLabel="Remove Crew"
              // deleteVariant="outline"
              deleteClassName="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
              onRowClick={handleView}
            />
          </div>
        </div>
      </div>
      {/* <ConfirmModal
        isOpen={openDelete}
        onClose={() => {
          if (isUpdatingCrew) return;
          setOpenDelete(false);
          setSelectedCrew(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={isUpdatingCrew}
        variant="warning"
        title="Remove Crew"
        confirmLabel="Remove"
        description={
          selectedCrew ? (
            <>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-gray-800 dark:text-white">
                {`${selectedCrew.firstName || ""} ${selectedCrew.lastName || ""}`.trim() || "this crew member"}
              </span>{" "}
              from the crews list? This will delete linked contract data, clear checklist/onboarding details, and move the person back to candidates.
            </>
          ) : (
            "Are you sure you want to remove this crew member from the crews list? This will delete linked contract data, clear checklist/onboarding details, and move the person back to candidates."
          )
        }
      /> */}
    </>
  );
}
