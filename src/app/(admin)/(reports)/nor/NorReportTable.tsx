"use client";

import ComponentCard from "@/components/common/ComponentCard";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import DownloadPdfButton from "@/components/common/DownloadPdfButton";
import EditModal from "@/components/common/EditModal";
import SharePdfButton from "@/components/common/SharePdfButton";
import ViewModal from "@/components/common/ViewModal";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import SearchableSelect from "@/components/form/SearchableSelect";
import Select from "@/components/form/Select";
import CommonReportTable from "@/components/tables/CommonReportTable";
import Badge from "@/components/ui/badge/Badge";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useVoyageLogic } from "@/hooks/useVoyageLogic";
import { FileCheck, FileText, FileWarning, ImageIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation"; // ✅ Added router
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "react-toastify";

// --- Interfaces ---
interface INorDetails {
  tenderTime?: string;
  etaPort?: string;
  pilotStation?: string;
  documentUrl?: string;
}
interface UserRef {
  _id: string;
  fullName: string;
}
export interface INorReport {
  _id: string;
  vesselId:
    | string
    | {
        _id: string;
        name: string;
        company?: { name: string };
      }
    | null;
  voyageId: string | { _id: string; voyageNo: string } | null;

  vesselName?: string;
  voyageNo?: string;

  portName: string;
  reportDate: string;
  status: string;
  remarks: string;
  norDetails?: INorDetails;
  createdBy?: UserRef;
  updatedBy?: UserRef;
  createdAt?: string;
  updatedAt?: string;
}

// Interface for the flat structure used in the Edit Form
interface IEditNorData {
  status: string;
  vesselName: string;
  voyageNo: string; //  String for Dropdown
  vesselId: string; //  ID for Logic
  portName: string;
  remarks: string;
  reportDate: string;
  pilotStation: string;
  norTenderTime: string;
  etaPort: string;
}

// ✅ Updated Props
interface NORReportTableProps {
  data: INorReport[]; // Passed from Server
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  vesselList: any[];
  allVoyages: any[]; // New Prop
}

export default function NorReportTable({
  data,
  pagination,
  vesselList,
  allVoyages,
}: NORReportTableProps) {
  const router = useRouter(); // ✅ Init Router
  const searchParams = useSearchParams();

  const reports = data; // Use prop directly

  // Modal States
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Selection States
  const [selectedReport, setSelectedReport] = useState<INorReport | null>(null);
  const [editData, setEditData] = useState<IEditNorData | null>(null);

  // New File State for Edit Mode
  const [newFile, setNewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Removed unused imageError state

  // Pagination & Loading States (Loading is now false since data is pre-fetched)
  const [saving, setSaving] = useState(false);
  
  // ✅ Voyage List from Props
  const voyageList = useMemo(() => {
     return allVoyages.map((v: any) => ({
        value: v.voyageNo, 
        label: v.voyageNo,
        vesselId: v.vesselId,
        status: "active" // Assuming active if passed from server filter
     }));
  }, [allVoyages]);

  const LIMIT = 20;
  const { can, isReady } = useAuthorization();
  const canEdit = can("nor.edit");
  const canDelete = can("nor.delete");
  const { suggestedVoyageNo } = useVoyageLogic(
    editData?.vesselId,
    editData?.reportDate,
  );

  useEffect(() => {
    //  FIX 2: Update 'voyageNo' in state
    if (
      editData &&
      suggestedVoyageNo !== undefined &&
      suggestedVoyageNo !== editData.voyageNo
    ) {
      setEditData((prev) =>
        prev ? { ...prev, voyageNo: suggestedVoyageNo } : null,
      );
    }
  }, [suggestedVoyageNo]);
  
  const getVesselName = (r: INorReport | null) => {
    if (!r) return "-";
    if (r.vesselId && typeof r.vesselId === "object" && "name" in r.vesselId) {
      return r.vesselId.name;
    }
    return r.vesselName || "-";
  };

  //  HELPER: Get Voyage Number (Handles Object or String)
  const getVoyageNo = (r: INorReport | null) => {
    if (!r) return "-";
    if (
      r.voyageId &&
      typeof r.voyageId === "object" &&
      "voyageNo" in r.voyageId
    ) {
      return r.voyageId.voyageNo;
    }
    return r.voyageNo || "-";
  };
  /* ================= HELPER: DATE FORMATTER ================= */
  // Moved up so it can be used in columns
  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata", // * Forces Indian Time
    });
  };

  const formatForInput = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString)
      .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
      .replace(" ", "T")
      .slice(0, 16);
  };

  // Helper to get trimmed company name
  const getCompanyName = (r: INorReport) => {
    if (r.vesselId && typeof r.vesselId === "object" && r.vesselId.company) {
      const name = r.vesselId.company.name;
      return name.length > 20 ? `${name.substring(0, 20)}...` : name;
    }
    return "-";
  };

  const filteredVoyageOptionsForEdit = useMemo(() => {
    if (!editData?.vesselId) return [];

    // 1. Filter voyages from the master list provided via props (syncing with Cargo logic)
    // We check both ID and Name to be safe, just like in your Cargo table
    // ✅ Using the 'voyageList' derived from props above
    const vesselVoyages = voyageList.filter(
      (v: any) =>
        v.vesselId?.toString() === editData.vesselId?.toString()
    );

    const options = vesselVoyages.map((v: any) => ({
      value: v.value,
      label: v.label,
    }));

    // 2. Add fallback for suggested or current voyage to prevent "undefined" display
    const currentOrSuggested = suggestedVoyageNo || editData.voyageNo;
    if (
      currentOrSuggested &&
      !options.some((opt) => opt.value === currentOrSuggested)
    ) {
      options.unshift({
        value: currentOrSuggested,
        label: currentOrSuggested,
      });
    }

    return options;
  }, [
    editData?.vesselId,
    editData?.vesselName,
    editData?.voyageNo,
    voyageList,
    suggestedVoyageNo,
  ]);

  // Status Badge Helper for Soft Delete
  const renderStatusBadge = (statusStr: string) => {
    let color: "success" | "warning" | "error" | "default" = "default";
    let label = statusStr;

    switch (statusStr?.toLowerCase()) {
      case "active":
        color = "success";
        label = "Active";
        break;
      case "inactive":
        color = "error";
        label = "Inactive";
        break;
      default:
        color = "default";
        label = statusStr || "N/A";
    }
    return <Badge color={color}>{label}</Badge>;
  };
  
  // ✅ Page Change Logic
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  /* ================= HELPER: FILE META EXTRACTION ================= */
  const getFileMeta = (url?: string) => {
    if (!url) return { name: "", isPdf: false, isImage: false };
    const name = url.split("/").pop() || "Document";
    const isPdf = name.toLowerCase().endsWith(".pdf");
    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(name);
    return { name, isPdf, isImage };
  };

  /* ================= 1. TABLE COLUMNS ================= */
  const columns = [
    {
      header: "S.No",
      render: (_: INorReport, index: number) =>
        (pagination.page - 1) * pagination.limit + index + 1,
    },
    {
      header: "Vessel & Voyage ID",
      render: (r: INorReport) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase text-gray-900 dark:text-white">
            {getVesselName(r)}
          </span>
          <span className="text-xs text-gray-500 uppercase tracking-tighter">
            ID: {getVoyageNo(r)}
          </span>
          <span
            className="text-xs text-gray-500"
            title={
              r.vesselId && typeof r.vesselId === "object"
                ? r.vesselId.company?.name
                : ""
            }
          >
            {getCompanyName(r)}
          </span>
        </div>
      ),
    },
    {
      header: "Report & Tender Time",
      render: (r: INorReport) => (
        <div className="flex flex-col text-xs space-y-0.5">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold">
              Reported
            </span>
            <span className="text-gray-700 dark:text-gray-300">
              {formatDate(r.reportDate)}
            </span>
          </div>
          <div className="flex flex-col pt-1 border-t border-gray-100 dark:border-white/5">
            <span className="text-[10px] text-gray-400 uppercase font-bold">
              Tendered
            </span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {formatDate(r.norDetails?.tenderTime)}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Port & Station",
      render: (r: INorReport) => (
        <div className="flex flex-col text-xs">
          <span className="font-bold truncate max-w-[150px]">
            {r?.portName ?? "-"}
          </span>
          <span className="text-gray-500">
            Station: {r?.norDetails?.pilotStation || "N/A"}
          </span>
        </div>
      ),
    },
    {
      header: "ETA & Document",
      render: (r: INorReport) => {
        const meta = getFileMeta(r?.norDetails?.documentUrl);

        return (
          <div className="flex flex-col text-xs gap-1">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase font-bold">
                ETA Port
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                {formatDate(r?.norDetails?.etaPort)}
              </span>
            </div>

            {r?.norDetails?.documentUrl ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                {/* Dynamic Icon based on type */}
                {meta.isPdf ? (
                  <FileText className="w-3.5 h-3.5 text-red-500" />
                ) : meta.isImage ? (
                  <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                ) : (
                  <FileCheck className="w-3.5 h-3.5 text-green-500" />
                )}

                <span className="font-medium text-gray-600 dark:text-gray-400">
                  {meta.isPdf
                    ? "PDF Attached"
                    : meta.isImage
                      ? "Image Attached"
                      : "Doc Attached"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-gray-400 italic mt-0.5">
                <FileWarning className="w-3.5 h-3.5 opacity-50" />
                <span>No document</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Status",
      render: (r: INorReport) => renderStatusBadge(r.status),
    },
  ];

  /* ================= HANDLERS ================= */
  function handleView(report: INorReport) {
    setSelectedReport(report);
    setOpenView(true);
  }

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];
  // Determine if preview is PDF
  const isPdfPreview = newFile
    ? newFile.type === "application/pdf"
    : previewUrl?.toLowerCase().endsWith(".pdf");

  /* ================= RENDER ================= */
  const fileMeta = selectedReport?.norDetails?.documentUrl
    ? getFileMeta(selectedReport.norDetails.documentUrl)
    : null;

  // Get current file meta for Edit modal (using selectedReport directly as it holds the saved URL)
  const currentFileMeta = selectedReport?.norDetails?.documentUrl
    ? getFileMeta(selectedReport.norDetails.documentUrl)
    : null;

  function handleEdit(report: INorReport) {
    setSelectedReport(report);
    setNewFile(null);
    const matchedVessel = vesselList.find(
      (v: any) => v.name === report.vesselName,
    );
    // Set initial preview to existing document URL
    setPreviewUrl(report.norDetails?.documentUrl || null);
    const vId =
      report.vesselId && typeof report.vesselId === "object"
        ? report.vesselId._id
        : (report.vesselId as string);
    const voyNo = getVoyageNo(report);
    setEditData({
      status: report.status ?? "active",
      vesselName: getVesselName(report),
      vesselId: vId || matchedVessel?._id || "",
      voyageNo: voyNo === "-" ? "" : voyNo, // Use the string for dropdown
      // Note: we removed the old 'voyageId' from editData as it was confusing. We use 'voyageNo' string for editing.
      portName: report.portName ?? "",
      remarks: report.remarks ?? "",
      reportDate: formatForInput(report.reportDate),
      pilotStation: report.norDetails?.pilotStation ?? "",
      norTenderTime: formatForInput(report.norDetails?.tenderTime),
      etaPort: formatForInput(report.norDetails?.etaPort),
    });
    setOpenEdit(true);
  }

  // UPDATED: Now sends FormData because the Backend PATCH route expects it
  async function handleUpdate() {
    if (!selectedReport || !editData) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("status", editData.status);
      formData.append("vesselName", editData.vesselName);
      formData.append("vesselId", editData.vesselId || "");
      formData.append("voyageNo", editData.voyageNo || ""); //  Send String

      formData.append(
        "reportDate",
        editData.reportDate ? `${editData.reportDate}+05:30` : "",
      );
      formData.append("portName", editData.portName);
      formData.append("remarks", editData.remarks);
      formData.append("pilotStation", editData.pilotStation);
      formData.append(
        "norTenderTime",
        editData.norTenderTime ? `${editData.norTenderTime}+05:30` : "",
      );
      formData.append(
        "etaPort",
        editData.etaPort ? `${editData.etaPort}+05:30` : "",
      );
      if (newFile) formData.append("norDocument", newFile);

      const res = await fetch(`/api/nor/${selectedReport._id}`, {
        method: "PATCH",
        body: formData,
      });
      if (!res.ok) throw new Error("Update failed");
      
      // ✅ Refresh Server Data
      router.refresh();
      
      toast.success("Updated");
      setOpenEdit(false);
      setSelectedReport(null);
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  }
async function handleDelete() {
    if (!selectedReport) return;
    
    // 1. Start loading
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/nor/${selectedReport._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Delete failed");
      }

      // 2. Immediate UI Feedback: Close modal and clear selection 
      // BEFORE the router refresh completes to prevent "ghost" states
      setOpenDelete(false);
      setSelectedReport(null);
      
      toast.success("Record deleted successfully");

      // 3. Trigger server-side data refresh
      router.refresh();

    } catch (err) {
      console.error("Delete Error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete record");
      
      // If it fails, we still want to close the modal so the user isn't stuck
      setOpenDelete(false);
      setSelectedReport(null);
    } finally {
      // 4. Reset loading state
      setIsDeleting(false);
    }
  }

  if (!isReady) return null;
  return (
    <>
      <div className="border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900 rounded-xl">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1200px]">
            <CommonReportTable
              data={reports} // ✅ Prop Data
              columns={columns}
              loading={false} // ✅ No local loading
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange} // ✅ URL Pagination
              onView={handleView}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={
                canDelete
                  ? (r: INorReport) => {
                      setSelectedReport(r);
                      setOpenDelete(true);
                    }
                  : undefined
              }
              onRowClick={handleView}
            />
          </div>
        </div>
      </div>

      {/* ================= VIEW MODAL ================= */}
      <ViewModal
        isOpen={openView}
        onClose={() => setOpenView(false)}
        title="Notice of Readiness (NOR) Details"
        headerRight={
          selectedReport && (
            <div className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
              <span className="font-bold">{getVesselName(selectedReport)}</span>
              <span>|</span>
              {getVoyageNo(selectedReport)}
            </div>
          )
        }
      >
        <div className="text-[13px] py-1">
          {/* ================= MAIN CONTENT GRID ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {/* ================= GENERAL INFORMATION ================= */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                General Information
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Vessel Name</span>
                <span className="font-medium text-right">
                  {getVesselName(selectedReport)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Voyage No</span>
                <span className="font-medium text-right">
                  {getVoyageNo(selectedReport)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Port Name</span>
                <span className="font-medium text-right">
                  {selectedReport?.portName ?? "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">NOR Tender Time</span>
                <span className="font-medium text-right">
                  {formatDate(selectedReport?.norDetails?.tenderTime)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">
                  Report Date & Time
                </span>
                <span className="font-medium text-right">
                  {formatDate(selectedReport?.reportDate)}
                </span>
              </div>
            </section>

            {/* ================= LOCATION DETAILS ================= */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                Location Details
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Pilot Station</span>
                <span className="font-medium text-right">
                  {selectedReport?.norDetails?.pilotStation ?? "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">ETA Port</span>
                <span className="font-medium text-right">
                  {formatDate(selectedReport?.norDetails?.etaPort)}
                </span>
              </div>
            </section>

            {/* ================= ATTACHED DOCUMENTS ================= */}
            <section className="md:col-span-2 space-y-3 pt-2">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 border-b">
                Attached Document
              </h3>

              {!fileMeta || !selectedReport?.norDetails?.documentUrl ? (
                <span className="text-gray-400 text-xs italic">
                  No file attached
                </span>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-gray-50 dark:bg-white/[0.02] p-3 rounded-lg border border-gray-100 dark:border-white/5">
                  <div className="w-20 h-20 flex-shrink-0 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                    {fileMeta.isImage && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={selectedReport.norDetails.documentUrl}
                        alt="Preview"
                        className="w-full h-full object-contain p-1"
                      />
                    )}

                    {fileMeta.isPdf && (
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-8 h-10 bg-red-500 rounded flex items-center justify-center shadow-sm mb-1">
                          <span className="text-white font-bold text-[8px]">
                            PDF
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ⚙️ INFO & ACTIONS */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {fileMeta.name}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      {fileMeta.isPdf ? "PDF Document" : "Image File"}
                    </p>

                    <div className="flex items-center gap-2">
                      <a
                        href={selectedReport.norDetails.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-[11px] font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded transition shadow-sm dark:bg-slate-700 dark:text-white dark:border-slate-600"
                      >
                        Open
                      </a>
                      <a
                        href={selectedReport.norDetails.documentUrl}
                        download
                        className="px-3 py-1 text-[11px] font-medium text-white bg-brand-500 hover:bg-brand-600 rounded transition shadow-sm"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* ================= REMARKS ================= */}
            <section className="md:col-span-2">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 border-b">
                Remarks
              </h3>
              <p className="leading-relaxed py-1 font-medium">
                {selectedReport?.remarks || "No remarks provided."}
              </p>
            </section>
            {/* NorReportTable ViewModal Audit Section */}
            {/* ================= SYSTEM INFORMATION (EXACT STYLE MATCH) ================= */}
            <section className="md:col-span-2 space-y-1.5 pt-1 mt-4 border-t border-gray-200 dark:border-white/10">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                System Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1.5">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Created By</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {selectedReport?.createdBy?.fullName || "System"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Created At</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatDate(selectedReport?.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Last Updated By</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {selectedReport?.updatedBy?.fullName || "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Last Updated At</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatDate(selectedReport?.updatedAt)}
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* ================= FOOTER: STATUS & SHARE ================= */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-12">
            <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Status
              </span>
              {renderStatusBadge(selectedReport?.status || "")}
            </div>

            {/* ACTIONS (DOWNLOAD & SHARE) */}
            <div className="pt-4 md:pt-0 flex flex-col md:items-end gap-3">
              {selectedReport && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {/* 1. DOWNLOAD BUTTON */}
                  <DownloadPdfButton
                    title={`Notice of Readiness - ${getVesselName(
                      selectedReport,
                    )}`}
                    filename={`NOR_${selectedReport.portName}_${getVoyageNo(
                      selectedReport,
                    )}`}
                    buttonLabel="Download Report"
                    data={{
                      "Report Status":
                        selectedReport.status?.toUpperCase() || "ACTIVE",
                      "Vessel Name": getVesselName(selectedReport),
                      "Voyage No": getVoyageNo(selectedReport),
                      "Port Name": selectedReport.portName,
                      "NOR Tender Time": formatDate(
                        selectedReport?.norDetails?.tenderTime,
                      ),
                      "Pilot Station":
                        selectedReport?.norDetails?.pilotStation || "-",
                      "ETA Port": formatDate(
                        selectedReport?.norDetails?.etaPort,
                      ),
                      "Report Date": formatDate(selectedReport.reportDate),
                      Remarks: selectedReport.remarks || "No Remarks",
                    }}
                  />

                  {/* 2. SHARE BUTTON */}
                  <SharePdfButton
                    title={`Notice of Readiness - ${getVesselName(
                      selectedReport,
                    )}`}
                    filename={`NOR_${selectedReport.portName}_${getVoyageNo(
                      selectedReport,
                    )}`}
                    data={{
                      "Report Status":
                        selectedReport.status?.toUpperCase() || "ACTIVE",
                      "Vessel Name": getVesselName(selectedReport),
                      "Voyage No": getVoyageNo(selectedReport),
                      "Port Name": selectedReport.portName,
                      "NOR Tender Time": formatDate(
                        selectedReport?.norDetails?.tenderTime,
                      ),
                      "Pilot Station":
                        selectedReport?.norDetails?.pilotStation || "-",
                      "ETA Port": formatDate(
                        selectedReport?.norDetails?.etaPort,
                      ),
                      "Report Date": formatDate(selectedReport.reportDate),
                      Remarks: selectedReport.remarks || "No Remarks",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </ViewModal>

      {/* ================= EDIT MODAL ================= */}
      <EditModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit NOR Record"
        loading={saving}
        onSubmit={handleUpdate}
      >
        {editData && (
          <div className="max-h-[70vh] overflow-y-auto p-1 space-y-3">
            <ComponentCard title="General Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Report Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={editData.reportDate}
                    onChange={(e) =>
                      setEditData({ ...editData, reportDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Vessel Name</Label>
                  <SearchableSelect
                    options={vesselList.map((v: any) => ({
                      value: v.name,
                      label: v.name,
                    }))}
                    placeholder="Search Vessel"
                    value={editData.vesselName}
                    onChange={(val) => {
                      const selected = vesselList.find(
                        (v: any) => v.name === val,
                      );
                      setEditData({
                        ...editData,
                        vesselName: val,
                        vesselId: selected?._id || "",
                        voyageNo: "", // 🔥 reset voyage when vessel changes
                      });
                    }}
                  />
                </div>
                <div className="relative">
                  <Label>Voyage No</Label>
                  <SearchableSelect
                    options={filteredVoyageOptionsForEdit}
                    placeholder={
                      !editData.vesselId
                        ? "Select Vessel first"
                        : filteredVoyageOptionsForEdit.length === 0
                          ? "No active voyages found"
                          : "Search Voyage"
                    }
                    value={editData.voyageNo}
                    onChange={(val) =>
                      setEditData({ ...editData, voyageNo: val })
                    }
                  />
                </div>
                <div>
                  <Label>Port Name</Label>
                  <Input
                    value={editData.portName}
                    onChange={(e) =>
                      setEditData({ ...editData, portName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="relative">
                    <Select
                      options={statusOptions}
                      placeholder="Select Status"
                      value={editData.status}
                      onChange={(val) =>
                        setEditData({ ...editData, status: val })
                      }
                      className="dark:bg-dark-900"
                    />
                    <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400"></span>
                  </div>
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Timings & Location">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>NOR Tender Time </Label>
                  <Input
                    type="datetime-local"
                    value={editData.norTenderTime}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        norTenderTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>ETA Port </Label>
                  <Input
                    type="datetime-local"
                    value={editData.etaPort}
                    onChange={(e) =>
                      setEditData({ ...editData, etaPort: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Pilot Station</Label>
                  <Input
                    value={editData.pilotStation}
                    onChange={(e) =>
                      setEditData({ ...editData, pilotStation: e.target.value })
                    }
                    placeholder="E.g. Inner Pilot Station"
                  />
                </div>
              </div>
            </ComponentCard>

            {/* FILE EDIT SECTION */}
            <ComponentCard title="Document">
              <div className="mt-2">
                <Label className="mb-2 block">
                  {currentFileMeta
                    ? "Replace File - Max 500 KB"
                    : "Upload File - Max 500 KB"}
                </Label>

                {/* INPUT CONTAINER */}
                <div className="border border-gray-300 rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-gray-700">
                  <input
                    type="file"
                    accept=".pdf, .jpg, .jpeg, .png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];

                        // 500 KB Validation
                        if (file.size > 500 * 1024) {
                          toast.error("File size must be below 500 KB.");
                          e.target.value = ""; // Reset input
                          return;
                        }

                        setNewFile(file);
                        setPreviewUrl(URL.createObjectURL(file));
                        // Note: Ensure isPdfPreview state is updated here based on file type if needed
                      }
                    }}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 dark:text-gray-400"
                  />
                </div>
              </div>

              {/* --- PREVIEW SECTION (MATCHING VIEW MODAL STYLE) --- */}
              {previewUrl && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                  <Label className="mb-3 block text-xs uppercase text-gray-500 font-semibold">
                    {newFile ? "New File Selected" : "Current File"}
                  </Label>

                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {/* 🖼 THUMBNAIL (Fixed Small Square) */}
                    <div className="w-32 h-32 flex-shrink-0 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center overflow-hidden">
                      {/* Logic: If it's a PDF, show ICON. If Image, show Thumbnail. */}
                      {isPdfPreview ? (
                        <div className="flex flex-col items-center justify-center text-center p-2">
                          <div className="w-10 h-12 bg-red-500 rounded flex items-center justify-center shadow-sm mb-1">
                            <span className="text-white font-bold text-[10px]">
                              PDF
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 truncate max-w-[90px]">
                            Document
                          </p>
                        </div>
                      ) : (
                        // Image Preview
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-contain p-1"
                        />
                      )}
                    </div>

                    {/* ⚙️ INFO PANEL & BUTTONS */}
                    <div className="flex flex-col justify-center h-32 gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                          {newFile
                            ? newFile.name
                            : currentFileMeta?.name || "Unknown File"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {isPdfPreview ? "PDF Document" : "Image File"}
                        </p>
                        {newFile && (
                          <span className="text-[10px] text-green-600 font-medium">
                            Ready to Upload
                          </span>
                        )}
                      </div>

                      {/* --- ACTION BUTTONS --- */}
                      <div className="flex items-center gap-2">
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-1.5 text-xs font-medium 
                                     text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 
                                     rounded-md transition shadow-sm
                                     dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600"
                        >
                          Open
                        </a>

                        <a
                          href={previewUrl}
                          download={newFile ? newFile.name : "download"}
                          className="px-4 py-1.5 text-xs font-medium 
                                     text-white bg-brand-500 hover:bg-brand-600 
                                     rounded-md transition shadow-sm border border-transparent"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ComponentCard>

            <ComponentCard title="Remarks">
              <TextArea
                rows={4}
                value={editData.remarks}
                onChange={(e) =>
                  setEditData({ ...editData, remarks: e.target.value })
                }
              />
            </ComponentCard>
          </div>
        )}
      </EditModal>

      {/* ================= DELETE MODAL ================= */}
      <ConfirmDeleteModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </>
  );
}