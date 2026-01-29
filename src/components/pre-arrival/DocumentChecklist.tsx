"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Button from "@/components/ui/button/Button";
import FileInput from "@/components/form/input/FileInput";
import Input from "@/components/form/input/InputField";
import { toast } from "react-toastify";
import Badge from "@/components/ui/badge/Badge";
import {
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  RefreshCw,
  Download,
  MessageSquare,
} from "lucide-react";
import ComponentCard from "@/components/common/ComponentCard";
import { useAuthorization } from "@/hooks/useAuthorization";
import { Modal } from "../ui/modal";
import TextArea from "../form/input/TextArea";
import RejectionModal from "../common/RejectionModal";
import HistoryModal from "./HistoryModal";

interface StatutoryChecklistProps {
  uploadedData: any;
  onUpload: (item: any, file: File) => void;
  onView: (item: any) => void;
  onNoteChange: (docId: string, value: string) => void;
  onVerify: (
    docId: string,
    status: "approved" | "rejected",
    reason?: string,
  ) => void;
  isReadOnly?: boolean; // ✅ Added isReadOnly prop
}
interface DocDefinition {
  id: string;
  name: string;
  owner: string;
}
export default function StatutoryChecklistTable({
  uploadedData,
  onUpload,
  onView,
  onNoteChange,
  onVerify,
  isReadOnly = false, // ✅ Default to false
}: StatutoryChecklistProps) {
  const [tempFiles, setTempFiles] = useState<Record<string, string>>({});
  const { can, isSuperAdmin, isReady } = useAuthorization();
  const [optimisticStatus, setOptimisticStatus] = useState<
    Record<string, string>
  >({});
  const hasUploadPerm = can("prearrival.upload");
  
  const hasVerifyPerm = can("prearrival.verify");
  const canSeeAll = can("prearrival.viewall");
const [filterStatus, setFilterStatus] = useState<"all" | "approved" | "rejected" | "pending">("all");
  const [historyModal, setHistoryModal] = useState<{
    isOpen: boolean;
    data: any[];
    title: string;
  }>({
    isOpen: false,
    data: [],
    title: "",
  });
  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    docId: string | null;
  }>({
    isOpen: false,
    docId: null,
  });

  const allDocuments = useMemo(
    () => [
      {
        id: "pre_arrival_form",
        name: "Pre‑Arrival Form (Signed/Sealed)",
        owner: "ship",
      },
      {
        id: "health_decl",
        name: "Maritime Declaration of Health",
        owner: "ship",
      },
      {
        id: "temp_14_days",
        name: "14‑Days Crew Temperature List",
        owner: "ship",
      },
      {
        id: "crew_health_decl",
        name: "Crew Health Declaration",
        owner: "ship",
      },
      { id: "arrival_nil_cargo", name: "Arrival NIL Cargo", owner: "ship" },
      { id: "arms_decl", name: "Arms & Ammunition Declaration", owner: "ship" },
      { id: "nil_list", name: "NIL List", owner: "ship" },
      { id: "bond_store", name: "Bond Store List", owner: "ship" },
      { id: "rob_dg", name: "ROB & DG Format", owner: "ship" },
      {
        id: "imo_maritime_decl",
        name: "IMO Maritime Declaration",
        owner: "ship",
      },
      { id: "registry_cert", name: "Registry Certificate", owner: "office" },
      { id: "tonnage_cert", name: "Tonnage Certificate", owner: "office" },
      { id: "isps_ship", name: "Ship ISPS Certificate", owner: "office" },
      { id: "pi_cert", name: "P&I Certificate", owner: "office" },
      {
        id: "msm_cert",
        name: "Minimum Safe Manning Certificate",
        owner: "office",
      },
      { id: "last_10_ports", name: "Last 10 Ports of Call", owner: "ship" },
      { id: "ships_particulars", name: "Ship's Particulars", owner: "office" },
      {
        id: "hull_machinery",
        name: "Hull & Machinery Certificate",
        owner: "office",
      },
      {
        id: "safety_equipment",
        name: "Safety Equipment Certificate",
        owner: "office",
      },
      {
        id: "sanitation_cert",
        name: "Ship Sanitation Certificate",
        owner: "office",
      },
      {
        id: "medical_chest",
        name: "Medical Chest Certificate",
        owner: "office",
      },
      { id: "isps_officer", name: "Officer ISPS Certificate", owner: "office" },
      { id: "port_clearance", name: "Port Clearance (Last PC)", owner: "ship" },
      { id: "imo_crew_list", name: "IMO Crew List (Word/Pdf)", owner: "ship" },
      {
        id: "security_report",
        name: "Ship’s Pre‑Arrival Security Report",
        owner: "office",
      },
    ],
    [],
  );
  const filteredData = useMemo(() => {
    // 1. Explicitly type the array to prevent the ts(7005) error
    let baseDocs: DocDefinition[] = [];

    // 2. Determine base visibility based on specific permissions
    if (isSuperAdmin || canSeeAll) {
      baseDocs = [...allDocuments];
    } else if (hasVerifyPerm) {
      // Office users: Only see office-owned documents
      baseDocs = allDocuments.filter((doc) => doc.owner === "office");
    } else if (hasUploadPerm) {
      // Ship users: Only see ship-owned documents
      baseDocs = allDocuments.filter((doc) => doc.owner === "ship");
    } else {
      baseDocs = [];
    }
    if (filterStatus !== "all") {
    baseDocs = baseDocs.filter((doc) => {
      const status = uploadedData?.[doc.id]?.status || "draft";
      const fileInfo = uploadedData?.[doc.id];
      const isUploaded = !!fileInfo?.fileUrl || !!tempFiles[doc.id];
      if (filterStatus === "pending") {
      return isUploaded && status !== "approved" && status !== "rejected";
    }
      return status === filterStatus;
    });
  }

    if (isReadOnly) {
      return baseDocs.filter((doc) => {
        const status = uploadedData?.[doc.id]?.status;
        return status === "approved";
      });
    }

    return baseDocs.sort((a, b) => {
      if (a.owner === b.owner) return 0;
      return a.owner === "office" ? 1 : -1;
    });
  }, [
    isSuperAdmin,
    hasUploadPerm,
    hasVerifyPerm,
    canSeeAll,
    allDocuments,
    isReadOnly,
    uploadedData,
    filterStatus
  ]);

  const handleInstantVerify = (
    docId: string,
    status: "approved" | "rejected",
  ) => {
    if (isReadOnly) return;

    if (status === "rejected") {
      setRejectModal({ isOpen: true, docId }); // ✅ Trigger Modal instead of immediate call
    } else {
      setOptimisticStatus((prev) => ({ ...prev, [docId]: status }));
      onVerify(docId, status);
    }
  };
  const handleConfirmRejection = (reason: string) => {
    if (rejectModal.docId) {
      const docId = rejectModal.docId;

      // Set local UI status immediately
      setOptimisticStatus((prev) => ({ ...prev, [docId]: "rejected" }));

      // ✅ PASS REASON HERE: Don't call onNoteChange.
      // Passing reason here ensures handleVerify gets it.
      onVerify(docId, "rejected", reason);

      setRejectModal({ isOpen: false, docId: null });
    }
  };

  const getFileIcon = (name: string) => {
    if (!name) return <FileIcon className="h-4 w-4 text-blue-500" />;
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FileText className="h-4 w-4 text-red-500" />;
    if (["xlsx", "xls", "csv"].includes(ext || ""))
      return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
    return <FileIcon className="h-4 w-4 text-blue-500" />;
  };
  // Simple Rejection Reason Modal

  const stats = useMemo(() => {
    
    const myDocIds = allDocuments
      .filter((doc) => {
        // Filter by permission so Ship user only sees their own stats
        if (isSuperAdmin || canSeeAll) return true;
        if (hasVerifyPerm) return doc.owner === "office";
        if (hasUploadPerm) return doc.owner === "ship";
        return false;
      })
      .map((d) => d.id);

    const approvedCount = myDocIds.filter((id) => {
      return uploadedData?.[id]?.status === "approved";
    }).length;
    const pendingCount = myDocIds.filter((id) => {
    const doc = uploadedData?.[id];
    const isUploaded = !!doc?.fileUrl || !!doc?.vesselCertId || !!tempFiles[id];
    return isUploaded && doc?.status !== "approved" && doc?.status !== "rejected";
  }).length;
  

    const rejectedCount = myDocIds.filter((id) => {
      return uploadedData?.[id]?.status === "rejected";
    }).length;

    const uploadedCount = myDocIds.filter((id) => {
      const doc = uploadedData?.[id];
      return !!doc?.fileUrl || !!doc?.vesselCertId || !!tempFiles[id];
    }).length;

    const total = myDocIds.length;

    return { total, uploadedCount, approvedCount, rejectedCount,pendingCount };
  }, [
    allDocuments,
    uploadedData,
    tempFiles,
    isSuperAdmin,
    canSeeAll,
    hasVerifyPerm,
    hasUploadPerm,
  ]);

  const progressLabel = isSuperAdmin
    ? "Total Pack Progress"
    : hasUploadPerm
      ? "Submissions"
      : "Office Verifications";

  useEffect(() => {
    setTempFiles({});
  }, [uploadedData]);

  if (!isReady) return null;

  return (
    <ComponentCard
      title={isReadOnly ? "Approved Document Pack" : "Upload All Documents "}
     action={
  <div className="flex flex-col items-end w-full sm:w-auto">
    {/* flex-wrap ensures that on mobile, items drop to the next line instead of disappearing */}
 <div className="flex flex-wrap items-center justify-end gap-2">
  {/* Unified Container */}
 <div className="flex flex-wrap items-center">
  {/* Approved Count */}
  <div
    className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity"
    onClick={() => setFilterStatus(filterStatus === "approved" ? "all" : "approved")}
  >
    <span className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${filterStatus === "approved" ? "text-emerald-600" : "text-gray-400"}`}>
      Approved
    </span>
    <Badge color="success" size="sm" variant="light">
      {stats.approvedCount}
    </Badge>
  </div>
  

  {/* Rejected Count */}
  <div
    className="flex items-center gap-2 border-l border-gray-200/50 dark:border-white/10 px-2 sm:px-3 py-1 cursor-pointer hover:opacity-80 transition-opacity"
    onClick={() => setFilterStatus(filterStatus === "rejected" ? "all" : "rejected")}
  >
    <span className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${filterStatus === "rejected" ? "text-red-600" : "text-gray-400"}`}>
      Rejected
    </span>
    <Badge color="error" size="sm" variant="light">
      {stats.rejectedCount}
    </Badge>
  </div>
  <div className="flex items-center gap-2 border-l border-gray-200 dark:border-white/10 px-2 sm:px-3 py-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setFilterStatus(filterStatus === "pending" ? "all" : "pending")}>
              <span className={`text-[10px] font-bold uppercase whitespace-nowrap ${filterStatus === "pending" ? "text-amber-600" : "text-gray-400"}`}>Pending</span>
              <Badge color="warning" size="sm" variant= "light">{stats.pendingCount}</Badge>
            </div>

  {/* Total Progress */}
  <div
    className="flex items-center gap-2 border-l border-gray-200/50 dark:border-white/10 px-2 sm:px-3 py-1 cursor-pointer hover:opacity-80 transition-opacity"
    onClick={() => setFilterStatus("all")}
  >
    <span className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${filterStatus === "all" ? "text-brand-500" : "text-gray-400"}`}>
      {progressLabel}
    </span>
    <Badge color="primary" size="sm" variant="light">
      {stats.uploadedCount} / {stats.total}
    </Badge>
  </div>
</div>
</div>
  </div>
}
    >
      <div className="max-h-[55vh] overflow-y-auto relative custom-scrollbar border border-gray-100 dark:border-white/5 rounded-xl overflow-anchor-none">
        <Table>
          <TableHeader className="relative z-20">
            <TableRow className="border-b border-gray-100 dark:border-white/10">
              <TableCell
                isHeader
                className="sticky top-0 z-30 px-4 py-3 text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider text-left bg-gray-50 dark:bg-slate-900 backdrop-blur-md w-1/4"
              >
                Document Name
              </TableCell>
              <TableCell
                isHeader
                className="sticky top-0 z-30 px-4 py-3 text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider text-left bg-gray-50 dark:bg-slate-900 backdrop-blur-md w-1/4"
              >
                Upload
              </TableCell>
              <TableCell
                isHeader
                className="sticky top-0 z-30 px-4 py-3 text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider text-left bg-gray-50 dark:bg-slate-900 backdrop-blur-md w-1/4" 
              >
                Notes
              </TableCell>
              {(hasVerifyPerm || canSeeAll) &&
                !isReadOnly && ( // ✅ Hide verification header if read-only
                  <TableCell
                    isHeader
                    className="sticky top-0 z-30 px-4 py-3 text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider text-left bg-gray-50 dark:bg-slate-900 backdrop-blur-md w-1/4"
                  >
                    Verification
                  </TableCell>
                )}
            </TableRow>
          </TableHeader>

          <TableBody className="relative z-10">
            {filteredData.map((row, index) => {
              const fileInfo = uploadedData?.[row.id];
              const currentStatus =
                optimisticStatus[row.id] || fileInfo?.status || "draft";
              const isUploaded =
                !!fileInfo?.fileUrl ||
                !!fileInfo?.vesselCertId ||
                !!tempFiles[row.id];

              let fileName = tempFiles[row.id] || fileInfo?.fileName;

              if (!fileName && fileInfo?.fileUrl) {
                try {
                  const urlParts = fileInfo.fileUrl.split("/");
                  const rawName = urlParts[urlParts.length - 1];
                  fileName =
                    decodeURIComponent(rawName)
                      .split("-")
                      .slice(0, -1)
                      .join("-") || rawName;
                } catch {
                  fileName = row.name;
                }
              }

              return (
                <TableRow
                  key={row.id}
                  className={`border-b border-gray-50 dark:border-white/5 transition-colors 
      ${
        currentStatus === "rejected"
          ? "bg-red-50 dark:bg-red-900/20" // ✅ Light red for rejected rows
          : index % 2 === 0
            ? "bg-white dark:bg-slate-900"
            : "bg-gray-50/30 dark:bg-white/[0.01]"
      } hover:bg-gray-100/50 dark:hover:bg-white/5`}
                >
             <TableCell className="px-4 py-2 text-left align-top w-1/4">
  <div className="flex items-start gap-3 py-1">
    <span className="text-xs font-mono text-gray-400 min-w-0 mt-2">
      {index + 1}.
    </span>
    <div className="flex flex-col min-w-0 ">
      {/* Container changed to flex-wrap to handle longer names */}
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <p className="text-sm text-gray-900 dark:text-white whitespace-normal break-words leading-tight font-medium">
          {row.name}
        </p>

        {/* ✅ History Trigger Button - Now wraps correctly with text */}
        {(fileInfo?.rejectionHistory?.length > 0 ||
          fileInfo?.notesHistory?.length > 0) && (
          <button
            onClick={() =>
              setHistoryModal({
                isOpen: true,
                data: [
                  ...(fileInfo?.rejectionHistory || []),
                  ...(fileInfo?.notesHistory || []),
                ].sort(
                  (a, b) =>
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime()
                ),
                title: row.name,
              })
            }
            className="p-1 hover:bg-brand-50 text-brand-500 rounded-md transition-all active:scale-90 shrink-0"
            title="View Message History"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Container for Badges */}
      <div className="mt-1.5 flex items-center gap-2">
        <Badge
          size="sm"
          variant="light"
          color={row.owner === "ship" ? "teal" : "slate"}
        >
          {row.owner === "ship" ? "Ship" : "Admin"}
        </Badge>
        {isUploaded && (
          <Badge
            size="sm"
            variant="light"
            color={
              (currentStatus === "approved"
                ? "success"
                : currentStatus === "rejected"
                  ? "error"
                  : "warning") as any
            }
          >
            {currentStatus === "approved"
              ? "Approved"
              : currentStatus === "rejected"
                ? "Rejected"
                : "Pending Review"}
          </Badge>
        )}
      </div>

      {/* Rejection Reason (Latest) */}
      {currentStatus === "rejected" && fileInfo?.rejectionReason && (
        <div className="mt-1.5 flex items-start gap-1.5 animate-in fade-in slide-in-from-top-1">
          <span className="text-red-600 dark:text-red-500 font-bold text-[12px] leading-tight">
            !
          </span>
          <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-tight italic">
            {fileInfo.rejectionReason}
          </p>
        </div>
      )}
    </div>
  </div>
</TableCell>
                  <TableCell className="px-4 py-2 text-left align-top w-1/4">
                    <div className="flex items-center min-h-[40px]">
                      {(hasUploadPerm || canSeeAll) && !isReadOnly ? ( // ✅ Hide upload/replace if read-only
                        <>
                          {isUploaded ? (
                            <div className="flex items-center gap-3 w-full animate-in fade-in slide-in-from-left-2">
                              <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-md shrink-0">
                                {getFileIcon(fileName || "")}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[13px] font-medium text-gray-700 dark:text-gray-200 truncate max-w-[180px]">
                                  {fileName || "Document Uploaded"}
                                </span>

                                {(isSuperAdmin ||
                                  (hasVerifyPerm && row.owner === "office") ||
                                  (hasUploadPerm &&
                                    !hasVerifyPerm &&
                                    row.owner === "ship")) && (
                                  <div className="flex items-center gap-3 mt-1">
                                    <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight text-gray-500 hover:text-accent cursor-pointer transition-colors">
                                      <RefreshCw className="h-4 w-4" />
                                      <span>Replace</span>
                                      <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            if (file.size > 512000) {
                                              toast.error(
                                                "File is too large. Max limit is 500KB",
                                              );
                                              e.target.value = "";
                                              return;
                                            }
                                            setTempFiles((prev) => ({
                                              ...prev,
                                              [row.id]: file.name,
                                            }));
                                            onUpload(row, file);
                                          }
                                        }}
                                      />
                                    </label>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : isSuperAdmin ||
                            (hasVerifyPerm && row.owner === "office") ||
                            (hasUploadPerm &&
                              !hasVerifyPerm &&
                              row.owner === "ship") ? (
                            <FileInput
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 512000) {
                                  toast.error(
                                    "File is too large. Max limit is 500KB",
                                  );
                                  e.target.value = "";
                                  return;
                                }
                                setTempFiles((prev) => ({
                                  ...prev,
                                  [row.id]: file.name,
                                }));
                                onUpload(row, file);
                              }}
                            />
                          ) : (
                            <div className="flex items-center gap-2 text-gray-400 opacity-50 italic">
                              <span className="text-[11px]">
                                Awaiting {row.owner} upload
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400">
                          {isUploaded && getFileIcon(fileName || "")}{" "}
                          {/* ✅ Show icon if file exists */}
                          <span className="text-[13px] font-medium text-gray-700 dark:text-gray-200 truncate max-w-[180px]">
                            {fileName ? fileName : "No document uploaded"}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
<TableCell className="px-4 py-2 text-left align-top w-1/4">
  {isReadOnly ? (
    // ✅ Added whitespace-normal and break-words to show full text
    <p className="text-[13px] text-gray-500 dark:text-gray-400 px-1 whitespace-normal break-words max-w-[200px] leading-relaxed">
      {fileInfo?.note || "No notes"}
    </p>
  ) : (
  
    <TextArea
      placeholder="Add a note..."
      className="text-[13px] hide-scrollbar bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 min-w-[180px] p-2 resize-none"
      rows={4}
      maxLength={120}
      defaultValue={fileInfo?.note || ""}
      onChange={(e) => onNoteChange(row.id, e.target.value)}
    />
  )}
</TableCell>
                  {(hasVerifyPerm || canSeeAll) &&
                    !isReadOnly && ( // ✅ Hide verification column if read-only
                      <TableCell className="px-4 py-2 align-top text-left w-1/4">
                        {isUploaded ? (
                          <div className="flex items-center gap-3">
                            <a
                              href={fileInfo?.fileUrl}
                              download
                              className="flex items-center justify-center h-[45px] w-[45px] bg-blue-50 dark:bg-transparent text-blue-600 rounded-lg border border-blue-100 dark:border-gray-100/10 transition-colors"
                              title="Download File"
                            >
                              <Download className="h-4 w-4" />
                            </a>

                            {/* ✅ Only show Approve/Reject if the document owner is the Ship */}
                            {row.owner === "ship" && (
                              <div className="flex items-center gap-2 animate-in fade-in zoom-in-95">
                                <Button
                                  onClick={() =>
                                    handleInstantVerify(row.id, "approved")
                                  }
                                  size="sm"
                                  className={`h-[45px] !py-0 px-4 text-[12px] font-bold border transition-all ${
                                    currentStatus === "approved"
                                      ? "!bg-transparent !text-emerald-700 !border-gray-200/50 dark:!text-emerald-400 dark:!border-gray-200/20"
                                      : "!bg-transparent !text-gray-400 !border-gray-200 dark:!text-gray-500 dark:!border-white/10"
                                  }`}
                                >
                                  Approve
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleInstantVerify(row.id, "rejected")
                                  }
                                  size="sm"
                                  className={`h-[45px] !py-0 px-4 text-[12px] font-bold border transition-all ${
                                    currentStatus === "rejected"
                                      ? "!bg-transparent !text-red-700 !border-gray-200/50 dark:!text-red-500 dark:!border-gray-200/20"
                                      : "!bg-transparent !text-gray-400 !border-gray-200 dark:!text-gray-500 dark:!border-white/10"
                                  }`}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-2 text-gray-400">
                            <span className="text-[10px] font-semibold uppercase tracking-widest opacity-40 italic">
                              Awaiting Upload
                            </span>
                          </div>
                        )}
                      </TableCell>
                    )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <RejectionModal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, docId: null })}
        onConfirm={handleConfirmRejection}
      />
      <HistoryModal
        isOpen={historyModal.isOpen}
        onClose={() => setHistoryModal({ ...historyModal, isOpen: false })}
        history={historyModal.data}
        title={historyModal.title}
      />
    </ComponentCard>
  );
}
