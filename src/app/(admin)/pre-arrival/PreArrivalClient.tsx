"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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

interface PreArrivalClientProps {
  initialRequests: any[];
  initialVessels: any[];
  initialVoyages: any[];
  initialTotalPages: number;
  user: any;
}

export default function PreArrivalClient({
  initialRequests,
  initialVessels,
  initialVoyages,
  initialTotalPages,
  user: serverUser,
}: PreArrivalClientProps) {
  const { can, isReady } = useAuthorization();
  
  // State initialized with SSR data
  const [requests, setRequests] = useState(initialRequests);
  const [vessels] = useState(initialVessels);
  const [voyages] = useState(initialVoyages);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  
  const [refresh, setRefresh] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("pre-arrival");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const modalRef = useRef<any>(null);

  // Re-fetch logic for refresh/pagination
const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/pre-arrival?init=true&page=${currentPage}`);
      const result = await res.json();
      if (res.ok) {
        setRequests(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);

        // ✅ ADD THIS: If the workspace is open, find the updated version 
        // of the current request and update the modal's data source.
        if (isWorkspaceOpen && selectedRequest) {
          const updatedVersion = result.data.find(
            (r: any) => r._id === selectedRequest._id
          );
         if (updatedVersion && JSON.stringify(updatedVersion) !== JSON.stringify(selectedRequest)) {
    setSelectedRequest(updatedVersion);
  }
        }
      }
    } catch (err) {
      toast.error("Failed to refresh data");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, isWorkspaceOpen, selectedRequest]);

  // Sync refresh trigger
  useEffect(() => {
    if (refresh > 0) handleRefresh();
  }, [refresh, handleRefresh]);

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
      const res = await fetch(`/api/pre-arrival/${requestToDelete._id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Request deleted successfully");
        handleRefresh();
        setIsDeleteModalOpen(false);
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete");
      }
    } catch (err) {
      toast.error("Network error occurred");
    } finally {
      setIsDeleting(false);
      setRequestToDelete(null);
    }
  };

  const handleUpload = async (row: any) => {
    setIsModalLoading(true);
    try {
      const res = await fetch(`/api/pre-arrival/${row._id}`);
      const fullData = await res.json();
      if (res.ok) {
        setSelectedRequest(fullData);
        setIsViewMode(false);
        setIsWorkspaceOpen(true);
      }
    } catch (error) {
      toast.error("Error connecting to server");
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleView = async (row: any) => {
    setIsModalLoading(true);
    try {
      const res = await fetch(`/api/pre-arrival/${row._id}`);
      const fullData = await res.json();
      if (res.ok) {
        setSelectedRequest(fullData);
        setIsViewMode(true);
        setIsWorkspaceOpen(true);
      }
    } catch (error) {
      toast.error("Error connecting to server");
    } finally {
      setIsModalLoading(false);
    }
  };

  const columns = useMemo(() => [
    {
      header: "SNo",
      render: (_: any, index: number) => (
        <span>{((currentPage - 1) * 10 + (index + 1)).toString().padStart(2,)}</span>
      ),
    },
    {
      header: "Vessel Information",
      render: (row: any) => (
        <div className="py-1">
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">{row.vesselId?.name || "N/A"}</p>
       
          <p className="text-[10px] text-gray-400 font-mono uppercase">ID: {row.requestId}</p>
        </div>
      ),
    },
    {
      header: "Port & Port Agent",
      render: (row: any) => (
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">{row.portName}</p>
          <p className="text-[11px] text-gray-500 ">Agent: {row.agentContact || "N/A"}</p>
        </div>
      ),
    },
    {
      header: "ETA / Due Date",
      render: (row: any) => (
        <div className="text-xs space-y-0.5">
          <p className="text-gray-600 dark:text-gray-400"><span className="font-medium">ETA:</span> {formatDate(row.eta)}</p>
          <p className="text-gray-500 dark:text-gray-400 text-[10px] font-semibold uppercase tracking-wider">Due: {formatDate(row.dueDate)}</p>
        </div>
      ),
    },
{
  header: "Status",
  render: (row: any) => {
    // 1. Use the status exactly as it exists in the Database
    const dbStatus = row.status || "draft";

    // 2. Map the DB strings to your UI Badges
    const statusConfig: Record<string, { color: "warning" | "primary" | "info" | "success"; label: string }> = {
      draft: { color: "warning", label: "Draft" },
      published: { color: "primary", label: "Published" },
      sent: { color: "info", label: "Sent to Agent" },
      completed: { color: "success", label: "Completed" },
    };

    const config = statusConfig[dbStatus] || statusConfig.draft;

    return (
     <Badge color={config.color}>
          {config.label}
        </Badge>
    );
  },
},
   // Inside columns useMemo in PreArrivalClient.tsx

{
  header: "Pack Progress",
  render: (row: any) => {
    const isSuperAdmin = serverUser?.role?.toLowerCase() === "super-admin";
    const isAdmin = serverUser?.role?.toLowerCase() === "admin";
    const canSeeAll = can("prearrival.viewall");
    
    // 1. Convert Map to Array if necessary and get all documents
    const allDocs = Object.values(row.documents || {});
    
    // 2. Determine Logic based on Role
    let current = 0;
    let total = 0;
    let label = "";

    if (isSuperAdmin || isAdmin || canSeeAll) {
      // ADMIN LOGIC: Total approved out of 25 (including auto-approved office docs)
      current = allDocs.filter((d: any) => 
        (!!d.fileUrl || !!d.vesselCertId) && d.status === "approved"
      ).length;
      total = 25; 
      label = "Total Pack Progress";
    } else {
      // SHIP LOGIC: Only show progress for ship-owned documents
      const shipDocs = allDocs.filter((d: any) => d.owner === "ship");
      current = shipDocs.filter((d: any) => 
        (!!d.fileUrl || !!d.vesselCertId) && d.status === "approved"
      ).length;
      total = shipDocs.length || 13; // Dynamic based on ship assignments
      label = " Submissions";
    }

    const percentage = Math.min((current / total) * 100, 100);

    return (
      <div className="w-40">
        <div className="flex justify-between text-[10px] font-bold mb-1  text-gray-400">
          <div className="flex flex-col">
            <span>{label}</span>
          </div>
          <span className="text-brand-500 font-mono">
            {current}/{total}
          </span>
        </div>
        <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
         <div
  className={`h-full transition-all duration-1000 ease-out relative ${
    percentage === 100 
      ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]" 
      : "bg-gradient-to-r from-brand-600 to-brand-400"
  }`}
  style={{ width: `${percentage}%` }}
>
  {/* Glossy Overlay effect */}
  <div className="absolute inset-0 bg-white/20 w-full h-[1px] top-0" />
  
  {/* Subtle Pulse for active progress (less than 100%) */}
  {percentage > 0 && percentage < 100 && (
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite] -skew-x-12" />
  )}
</div>
        </div>
      </div>
    );
  },
}
  ], [currentPage]);

  const canAdd = isReady && can("prearrival.create");
  const canEdit = isReady && can("prearrival.edit");
  const canDelete = isReady && can("prearrival.delete");

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Pre‑Arrival Pack Management</h2>
          <p className="text-sm text-gray-500 italic">Manage port entry documentation and compliance.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* <FilterToggleButton isVisible={isFilterVisible} onToggle={setIsFilterVisible} /> */}
          {canAdd && (
            <>
              <Button size="md" variant="primary" onClick={handleAddNew}>Create Port Request</Button>
              <AddPreArrivalRequest
                ref={modalRef}
                onSuccess={handleRefresh}
                vesselList={vessels}
                voyageList={voyages}
                editData={editData}
              />
            </>
          )}
        </div>
      </div>

      <ComponentCard>
        <div className="flex justify-end mb-4 px-2">
          <TableCount count={requests.length} label="Request Packs" />
        </div>

      <div className="border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900 rounded-xl overflow-hidden">
    <div className="max-w-full overflow-x-auto custom-scrollbar">
      <div className="min-w-[1200px]"> 
        <CommonReportTable
          data={requests}
          columns={columns}
          loading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onUpload={handleUpload}
           onRowClick={handleView}
          onView={handleView}
          onEdit={canEdit ? handleEdit : undefined}
          onDelete={canDelete ? handleDeleteClick : undefined}
        />
      </div>
    </div>
  </div>
      </ComponentCard>

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
            </strong>? This will remove all associated document references.
          </span>
        }
      />
    </div>
  );
}