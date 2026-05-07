"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthorization } from "@/hooks/useAuthorization";
import { formatDate } from "@/lib/utils";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { toast } from "react-toastify";

// Components
import AddPreArrivalRequest from "@/components/pre-arrival/AddPreArrivalRequest";
import CommonReportTable from "@/components/tables/CommonReportTable";
import Badge from "@/components/ui/badge/Badge";
import ComponentCard from "@/components/common/ComponentCard";
import TableCount from "@/components/common/TableCount";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import WorkspaceModal from "@/components/pre-arrival/WorkspaceModal";
import Button from "@/components/ui/button/Button";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import PreArrivalFilterWrapper from "./Prearrivalfilterwrapper";

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PreArrivalClientProps {
  initialRequests: any[];
  initialVessels: any[];
  initialVoyages: any[];
  initialCompanies: any[];
  pagination: Pagination;
  user: any;
  isSuperAdmin: boolean;
}

export default function PreArrivalClient({
  initialRequests,
  initialVessels,
  initialVoyages,
  initialCompanies,
  pagination,
  user: serverUser,
  isSuperAdmin,
}: PreArrivalClientProps) {
  const isRowLocked = (row: any) =>
    !!row?.isLocked || ["sent", "acknowledged", "completed"].includes(row?.status);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { can, isReady } = useAuthorization();
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("pre-arrival");

  // ─── Data State (synced from SSR props on each navigation) ───────────────
  const [requests, setRequests] = useState<any[]>(initialRequests);
  const [vessels] = useState(initialVessels);
  const [voyages] = useState(initialVoyages);

  // Sync when SSR re-renders with new data (URL param change triggers page re-render)
  useEffect(() => {
    setRequests(initialRequests);
  }, [JSON.stringify(initialRequests)]);

  // ─── Modal States ─────────────────────────────────────────────────────────
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const modalRef = useRef<any>(null);

  // ─── Pagination: URL-driven (same pattern as CompaniesTable) ─────────────
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  // ─── Mutation Refresh: router.refresh() re-runs SSR page ─────────────────
  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  // ─── Action Handlers ──────────────────────────────────────────────────────
  const handleEdit = (row: any) => {
    setEditData(row);
    modalRef.current?.open();
  };

  const handleAddNew = () => {
    setEditData(null);
    modalRef.current?.open();
  };

  const handleDeleteClick = (row: any) => {
    setRequestToDelete(row);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!requestToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/pre-arrival/${requestToDelete._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Optimistic UI: remove from local state instantly
        setRequests((prev) =>
          prev.filter((r) => r._id !== requestToDelete._id)
        );
        toast.success("Request deleted successfully");
        setIsDeleteModalOpen(false);
        router.refresh(); // revalidate SSR
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete");
      }
    } catch {
      toast.error("Network error occurred");
    } finally {
      setIsDeleting(false);
      setRequestToDelete(null);
    }
  };

  const handleUpload = (row: any) => {
    setSelectedRequest(row);
    setIsViewMode(false);
    setIsWorkspaceOpen(true);
  };

  const handleView = (row: any) => {
    setSelectedRequest(row);
    setIsViewMode(true);
    setIsWorkspaceOpen(true);
  };

  // ─── Table Columns ────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        header: "SNo",
        render: (_: any, index: number) => (
          <span>
            {((pagination.page - 1) * pagination.limit + (index + 1))
              .toString()
              .padStart(2, "")}
          </span>
        ),
      },
      {
        header: "Vessel Information",
        render: (row: any) => (
          <div className="py-1">
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {row.vesselId?.name || "N/A"}
            </p>
            <p className="text-[10px] text-gray-400 font-mono uppercase">
              ID: {row.requestId}
            </p>
            {row.amendmentNo > 0 && (
              <span className="text-[10px] text-purple-500 font-medium">
                Amendment #{row.amendmentNo}
              </span>
            )}
          </div>
        ),
      },
      {
        header: "Port & Port Agent",
        render: (row: any) => (
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {row.portName}
            </p>
            <p className="text-[11px] text-gray-500">
              Agent: {row.agentContact || "N/A"}
            </p>
          </div>
        ),
      },
      {
        header: "ETA / Due Date",
        render: (row: any) => (
          <div className="text-xs space-y-0.5">
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">ETA:</span> {formatDate(row.eta)}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">DUE:</span> {formatDate(row.dueDate)}
            </p>
          </div>
        ),
      },
      {
        header: "Status",
        render: (row: any) => {
          const dbStatus = row.status || "draft";
          const statusConfig: Record<
            string,
            { color: "warning" | "primary" | "info" | "success"; label: string }
          > = {
            draft: { color: "warning", label: "Draft" },
            published: { color: "primary", label: "Published" },
            sent: { color: "info", label: "Sent to Agent" },
            acknowledged: { color: "success", label: "Acknowledged" },
            completed: { color: "success", label: "Completed" },
          };
          const config = statusConfig[dbStatus] || statusConfig.draft;
          return (
            <Badge color={config.color} size="sm">
              {config.label}
            </Badge>
          );
        },
      },
      {
        header: "Lock",
        render: (row: any) => isRowLocked(row) ? (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            Locked
          </span>
        ) : (
          <span className="text-xs text-gray-400">Open</span>
        ),
      },
      {
        header: "Pack Progress",
        render: (row: any) => {
          const isAdmin = can("prearrival.upload.admin.documents");
          const canSeeAll = can("prearrival.viewall");

          const uploadedDocs = row.documents || {};
          const allDocEntries = Object.entries(uploadedDocs);

          const TOTAL_OFFICE_DOCS = 12;
          const TOTAL_SHIP_DOCS = 13;
          const TOTAL_PACK_DOCS = 25;

          let current = 0;
          let total = 0;
          let label = "";

          if (isSuperAdmin || isAdmin || can("prearrival.viewall")) {
            current = allDocEntries.filter(
              ([_, d]: any) => d.status === "approved"
            ).length;
            total = TOTAL_PACK_DOCS;
            label = "Total Pack Progress";
          } else {
            current = allDocEntries.filter(
              ([_, d]: any) => d.owner === "ship" && d.status === "approved"
            ).length;
            total = TOTAL_SHIP_DOCS;
            label = "Submissions";
          }

          const percentage = Math.round((current / total) * 100);

          return (
            <div className="w-40">
              <div className="flex justify-between text-[10px] font-bold mb-1 text-gray-400">
                <span>{label}</span>
                <span className="text-brand-500 font-mono">
                  {current}/{total}
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden border border-gray-200/50 dark:border-white/5">
                <div
                  className={`h-full transition-all duration-1000 ease-out relative ${
                    percentage === 100
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                      : "bg-gradient-to-r from-brand-600 to-brand-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                  }`}
                  style={{ width: `${percentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-[1px] top-0" />
                  {percentage > 0 && percentage < 100 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse -skew-x-12" />
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
    ],
    [pagination.page, pagination.limit, isSuperAdmin, can]
  );

    const canAdd = isReady && can("prearrival.create");
    const canEdit = isReady && can("prearrival.edit");
    const canDelete = isReady && can("prearrival.delete");
    const canUpload = isReady && can("prearrival.upload");

    return (
    <div className="space-y-6 p-1">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Pre‑Arrival Pack Management
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage port entry documentation and compliance.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Filter Toggle */}
          <div className="w-full flex justify-end sm:w-auto">
            <FilterToggleButton
              isVisible={isFilterVisible}
              onToggle={setIsFilterVisible}
            />
          </div>

          {/* Add Button */}
          {canAdd && (
            <div className="w-full sm:w-auto">
              <Button
                size="md"
                variant="primary"
                onClick={handleAddNew}
                className="w-full justify-center"
              >
                Create Port Request
              </Button>
              <AddPreArrivalRequest
                ref={modalRef}
                onSuccess={handleRefresh}
                vesselList={vessels}
                voyageList={voyages}
                editData={editData}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Table Card ──────────────────────────────────────────────────── */}
      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          isFilterVisible ? (
            <PreArrivalFilterWrapper
              vessels={initialVessels}
              companies={initialCompanies}
              isSuperAdmin={isSuperAdmin}
            />
          ) : null
        }
      >
        {/* Total count */}
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={pagination.total} label="Request Packs" />
        </div>

        <div className="border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900 rounded-xl overflow-hidden">
          <div className="max-w-full overflow-x-auto custom-scrollbar">
            <div className="min-w-[1500px]">
              <CommonReportTable
                data={requests}
                columns={columns}
                loading={false}
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}   
                onUpload={canEdit || canUpload ? handleUpload : undefined}
                uploadVisible={(row: any) => !isRowLocked(row)}
                onRowClick={handleView}
                onView={handleView}
                onEdit={canEdit ? handleEdit : undefined}
                onDelete={canDelete ? handleDeleteClick : undefined}
              />
            </div>
          </div>
        </div>
      </ComponentCard>

      {/* ── Workspace Modal ──────────────────────────────────────────────── */}
      {isWorkspaceOpen && selectedRequest && (
        <WorkspaceModal
          isOpen={isWorkspaceOpen}
          onClose={() => {
            setIsWorkspaceOpen(false);
            setSelectedRequest(null);
            setIsViewMode(false);
          }}
          data={selectedRequest}
          userRole={serverUser?.role || "ship_master"}
          onSuccess={handleRefresh}
          isReadOnly={isViewMode}
        />
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────── */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        loading={isDeleting}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Port Request"
        description={
          <span>
            Are you sure you want to delete the request for{" "}
            <strong className="text-gray-900 dark:text-white">
              {requestToDelete?.vesselId?.name} ({requestToDelete?.requestId})
            </strong>
            ? This will remove all associated document references.
          </span>
        }
      />
    </div>
  );
}
