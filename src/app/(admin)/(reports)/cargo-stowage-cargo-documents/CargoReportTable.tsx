"use client";

import ComponentCard from "@/components/common/ComponentCard";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import EditModal from "@/components/common/EditModal";
import ViewModal from "@/components/common/ViewModal";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import CommonReportTable from "@/components/tables/CommonReportTable";
import Badge from "@/components/ui/badge/Badge";
import { File, FileSpreadsheet, FileText, FileWarning, ImageIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useVoyageLogic } from "@/hooks/useVoyageLogic";
// 1. Define Interface to replace 'any'
interface ICargoReportFile {
  url: string;
  name?: string;
}

interface ICargoReport {
  _id: string;
  vesselName: string;
  vesselId: string | { _id: string; name: string }; // Allow populated
  portType: string;
  portName: string;
  documentDate: string;
  reportDate: string;
  status: string;
 voyageNo : string; // This comes from schema (string)
  voyageId: string | { _id: string; voyageNo: string }; // Link
  documentType: string;
  remarks: string;
  file?: ICargoReportFile;
}
interface IEditData {
  status: string;
  vesselName: string;
  vesselId: string;
  voyageNo: string; // We use this for the dropdown value
  reportDate: string;
  portName: string;
  portType: string;
  documentType: string;
  documentDate: string;
  remarks: string;
}

interface CargoReportTableProps {
  refresh: number;
  search: string;
  status: string;
  startDate: string;
  endDate: string;
}

export default function CargoReportTable({
  refresh,
  search,
  status,
  startDate,
  endDate,
}: CargoReportTableProps) {
  // 2. Apply Interface to State
  const [reports, setReports] = useState<ICargoReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [voyageList, setVoyageList] = useState<{ value: string; label: string }[]>([]);
  // Selection States
  const [selectedReport, setSelectedReport] = useState<ICargoReport | null>(
    null
  );

  // Edit data state - using Partial or a specific edit interface is safer, but any is acceptable for form state if dynamic
  // We will keep it loosely typed for form handling flexibility or define a specific shape:
  const [editData, setEditData] = useState<{
    status: string;
    vesselName: string;
    vesselId?: string;
    voyageNo: string;
    reportDate: string;
    portName: string;
    portType: string;
    documentType: string;
    documentDate: string;
    remarks: string;
  } | null>(null);

  // New File State for Edit Mode
  const [newFile, setNewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [saving, setSaving] = useState(false);

  const LIMIT = 20;
  const { can, isReady } = useAuthorization();
    const canEdit = can("departure.edit");
    const canDelete = can("departure.delete");
const getVesselName = (r: ICargoReport | null) => {
    if (!r || !r.vesselId) return "-";
    if (typeof r.vesselId === "object" && "name" in r.vesselId) {
      return r.vesselId.name;
    }
    return "-";
  };

  // ✅ FIX: Handle null report and null voyageId safely
  const getVoyageNo = (r: ICargoReport | null) => {
    if (!r || !r.voyageId) return "-";
    if (typeof r.voyageId === "object" && "voyageNo" in r.voyageId) {
      return r.voyageId.voyageNo;
    }
    return "-";
  };
  /* ================= HELPER FUNCTIONS ================= */
  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  };


  const formatDateOnly = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  };

  const formatForInput = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString)
      .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
      .replace(" ", "T")
      .slice(0, 16);
  };
  const { vessels, suggestedVoyageNo } = useVoyageLogic(
    editData?.vesselId,
    editData?.reportDate
  );

  // ✅ 2. SYNC EFFECT (Auto-correct Voyage in Edit Mode)
  useEffect(() => {
  
    if (editData && suggestedVoyageNo !== undefined && suggestedVoyageNo !== editData.voyageNo) {
      
       setEditData(prev => prev ? { ...prev, voyageNo: suggestedVoyageNo } : null);
    }
  }, [suggestedVoyageNo]);
   useEffect(() => {
      async function fetchAndFilterVoyages() {
        // Stop if no vessel selected
        if (!editData?.vesselId) {
          setVoyageList([]);
          return;
        }
  
        try {
          const res = await fetch(`/api/voyages?vesselId=${editData.vesselId}`);
  
          if (res.ok) {
            const result = await res.json();
            const allVoyages = Array.isArray(result) ? result : result.data || [];
  
            // 🔒 STRICT FILTERING LOGIC
            const filtered = allVoyages.filter((v: any) => {
              // Rule 1: STRICTLY match the selected Vessel ID
              const isCorrectVessel =
                (v.vesselId && v.vesselId === editData.vesselId) ||
                (v.vesselName && v.vesselName === editData.vesselName);
  
              if (!isCorrectVessel) return false;
  
              // Rule 2: Show if Active OR matches Auto-Suggestion OR matches Current Selection
              const isRelevant =
                v.status === "active" ||
                v.voyageNo === suggestedVoyageNo ||
                v.voyageNo === editData.voyageNo;
  
              return isRelevant;
            });
  
            setVoyageList(
              filtered.map((v: any) => ({
                value: v.voyageNo,
                label: `${v.voyageNo} ${v.status !== "active" ? "" : ""}`,
              }))
            );
          }
        } catch (error) {
          console.error("Failed to load voyages", error);
          setVoyageList([]);
        }
      }
  
      fetchAndFilterVoyages();
    }, [editData?.vesselId, editData?.vesselName, suggestedVoyageNo, editData?.voyageNo]);

  /* ================= 1. TABLE COLUMNS ================= */
  const columns = [
    {
      header: "S.No",
      render: (_: ICargoReport, index: number) =>
        (currentPage - 1) * LIMIT + index + 1,
    },
    {
      header: "Vessel & Voyage ID",
      render: (r: ICargoReport) => (
        <div className="flex flex-col">
         <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {/* Dynamic Vessel Name */}
            {getVesselName(r)}
          </span>
          <span className="text-xs text-gray-500 uppercase tracking-tighter">
            {/* Dynamic Voyage No */}
            ID: {getVoyageNo(r)}
          </span>
        </div>
      ),
    },
    {
      header: "Report Date & Time",
      render: (r: ICargoReport) => (
        <div className="text-xs text-gray-700 dark:text-gray-300">
          {formatDate(r.reportDate)}
        </div>
      ),
    },
    {
      header: "Port Details",
      render: (r: ICargoReport) => (
        <div className="flex flex-col text-xs">
          <span className="font-bold truncate max-w-[150px]">
            {r?.portName ?? "-"}
          </span>
          <span className="capitalize text-gray-500">
            {r?.portType?.replace("_", " ")} Port
          </span>
        </div>
      ),
    },
    {
      header: "Document Info",
      render: (r: ICargoReport) => {
        const meta = getFileMeta(r?.file?.url);

        return (
          <div className="flex flex-col text-xs gap-1">
            <span className="font-medium text-gray-800 dark:text-gray-200 capitalize truncate max-w-[180px]">
              {r?.documentType?.replace(/_/g, " ")}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">{formatDateOnly(r.documentDate)}</span>
              
              {r?.file?.url ? (
                <div className="flex items-center gap-1" title={meta.name}>
                  {/* Icon Selection Logic */}
                  {meta.isPdf && (
                    <FileText className="w-3.5 h-3.5 text-red-500" />
                  )}
                  {meta.isImage && (
                    <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                  )}
                  {meta.isExcel && (
                    <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                  )}
                  {!meta.isPdf && !meta.isImage && !meta.isExcel && (
                    <File className="w-3.5 h-3.5 text-brand-500" />
                  )}
                  
                  <span className="text-[10px] font-bold uppercase text-gray-400">
                    {meta.isPdf ? "PDF" : meta.isExcel ? "XLS" : meta.isImage ? "IMG" : "DOC"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-300 italic" title="No file uploaded">
                  <FileWarning className="w-3 h-3 opacity-50" />
                  <span className="text-[10px]">Empty</span>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: "Status",
      render: (r: ICargoReport) => {
        const isActive = r.status === "active";
        return (
          <Badge color={isActive ? "success" : "error"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
  ];

  /* ================= 2. API FUNCTIONS ================= */

  // 3. Fix useEffect dependency warning: Wrap in useCallback
  const fetchReports = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const query = new URLSearchParams({
          page: page.toString(),
          limit: LIMIT.toString(),
          search,
          status,
          startDate,
          endDate,
        });

        const res = await fetch(`/api/cargo?${query.toString()}`);

        if (!res.ok) throw new Error(`Error: ${res.status}`);

        const result = await res.json();
        setReports(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
      } catch (err) {
        // Fix 'err' unused: Log it or use a typed catch
        console.error(err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    },
    [LIMIT, search, status, startDate, endDate]
  ); // Dependencies for useCallback

  async function handleUpdate() {
    if (!selectedReport || !editData) return;
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("status", editData.status);
      formData.append("vesselName", editData.vesselName);
      formData.append("vesselId", editData.vesselId || "");
      
      // ✅ FIX: Send voyageNo as string
      formData.append("voyageNo", editData.voyageNo); 

      formData.append("reportDate", editData.reportDate ? `${editData.reportDate}+05:30` : "");
      formData.append("portName", editData.portName);
      formData.append("portType", editData.portType);
      formData.append("documentType", editData.documentType);
      formData.append("documentDate", editData.documentDate);
      formData.append("remarks", editData.remarks);

      if (newFile) {
        formData.append("file", newFile);
      }

      const res = await fetch(`/api/cargo/${selectedReport._id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Update failed");
      }

      const { data } = await res.json();

      setReports((prev) => prev.map((r) => (r._id === data._id ? data : r)));

      toast.success("Record updated successfully");
      setOpenEdit(false);
      setSelectedReport(null);
      setNewFile(null);
      setPreviewUrl(null);
    } catch (err: unknown) {
      // Fix: Type safe error handling
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Failed to update record";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedReport) return;

    try {
      const res = await fetch(`/api/cargo/${selectedReport._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      setReports((prev) => prev.filter((r) => r._id !== selectedReport?._id));
      toast.success("Record deleted");
    } catch (err) {
      // Fix unused err by removing it or logging it
      console.error(err);
      toast.error("Failed to delete record");
    } finally {
      setOpenDelete(false);
      setSelectedReport(null);
    }
  }

  // 4. Fix useEffect dependencies
  // Reset to page 1 when filters change
  useEffect(() => {
    fetchReports(1);
    setCurrentPage(1);
  }, [fetchReports]);

  // Fetch when page changes (skip if it's page 1 as the previous effect handles that transition often, but logic here is fine)
  useEffect(() => {
    if (currentPage > 1) {
      fetchReports(currentPage);
    }
  }, [currentPage, fetchReports]);

  // Handle Refresh prop
  useEffect(() => {
    fetchReports(1);
    setCurrentPage(1);
  }, [refresh, fetchReports]);

  const getFileMeta = (url?: string) => {
    if (!url) return { name: "", isPdf: false, isImage: false, isExcel: false };
    const name = url.split("/").pop() || "Document";
    const isPdf = name.toLowerCase().endsWith(".pdf");
    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(name);
    const isExcel = /\.(xls|xlsx|csv)$/i.test(name);
    return { name, isPdf, isImage, isExcel };
  };

  /* ================= HANDLERS ================= */
  function handleView(report: ICargoReport) {
    setSelectedReport(report);
    setOpenView(true);
  }

  function handleEdit(report: ICargoReport) {
    setSelectedReport(report);
    setNewFile(null);
    setPreviewUrl(report.file?.url || null);
   
    const vesselIdStr = typeof report.vesselId === 'object' ? report.vesselId._id : report.vesselId;
    const voyageIdStr = typeof report.voyageId === 'object' ? report.voyageId.voyageNo : ""; // Use Voyage No string for dropdown logic
    setEditData({
      status: report.status ?? "active",
     vesselId: vesselIdStr,
      voyageNo: voyageIdStr, 
      vesselName: getVesselName(report),
      reportDate: formatForInput(report.reportDate),
      portName: report.portName ?? "",
      portType: report.portType ?? "load",
      documentType: report.documentType ?? "stowage_plan",
      documentDate: report.documentDate
        ? new Date(report.documentDate).toISOString().split("T")[0]
        : "",
      remarks: report.remarks ?? "",
    });
    setOpenEdit(true);
  }

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];
  const portTypeOptions = [
    { value: "load", label: "Load Port" },
    { value: "discharge", label: "Discharge Port" },
    { value: "departure", label: "Departure Port" },
  ];

  const docTypeOptions = [
    { value: "stowage_plan", label: "Cargo Stowage Plan" },
    { value: "cargo_documents", label: "Cargo Documents" },
    { value: "other", label: "Other" },
  ];

  const isPdfPreview = newFile
    ? newFile.type === "application/pdf"
    : previewUrl?.toLowerCase().endsWith(".pdf");

  const isExcelPreview = newFile
    ? newFile.name.endsWith(".xls") ||
      newFile.name.endsWith(".xlsx") ||
      newFile.name.endsWith(".csv")
    : previewUrl?.toLowerCase().endsWith(".xls") ||
      previewUrl?.toLowerCase().endsWith(".xlsx") ||
      previewUrl?.toLowerCase().endsWith(".csv");

  /* ================= RENDER ================= */
  const fileMeta = selectedReport?.file?.url
    ? getFileMeta(selectedReport.file.url)
    : null;

  const currentFileMeta = selectedReport?.file?.url
    ? getFileMeta(selectedReport.file.url)
    : null;
  if (!isReady) return null;
  return (
    <>
      <div className="border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900 rounded-xl">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1200px]">
           <CommonReportTable
  data={reports}
  columns={columns}
  loading={loading}
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  onView={handleView}
  onEdit={canEdit ? handleEdit : undefined}
  onDelete={
    canDelete
      ? (r: ICargoReport) => {
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
  title="Cargo Document Details"
  headerRight={
          selectedReport && (
            <div className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
              <span className="font-bold">
               {getVesselName(selectedReport)}
              </span>
              <span>|</span>
              <span>{getVoyageNo(selectedReport)}</span>
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
          <span className="text-gray-500 shrink-0">Port Type</span>
          <span className="font-medium capitalize text-right">
            {selectedReport?.portType?.replace("_", " ") ?? "-"}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 shrink-0">Report Date & Time</span>
          <span className="font-medium text-right">
            {formatDate(selectedReport?.reportDate)}
          </span>
        </div>
      </section>

      {/* ================= DOCUMENT DETAILS ================= */}
      <section className="space-y-1.5">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
          Document Details
        </h3>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 shrink-0">Document Type</span>
          <span className="font-medium capitalize text-right">
            {selectedReport?.documentType?.replace(/_/g, " ") ?? "-"}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500 shrink-0">Document Date</span>
          <span className="font-medium text-right">
            {formatDateOnly(selectedReport?.documentDate)}
          </span>
        </div>
      </section>

      {/* ================= ATTACHED DOCUMENT ================= */}
      <section className="md:col-span-2 space-y-3 pt-2">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 border-b">
          Attached Document
        </h3>
        
        {!fileMeta || !selectedReport?.file?.url ? (
          <span className="text-gray-400 text-xs italic">
            No file attached
          </span>
        ) : (
          <div className="flex flex-row gap-4 items-center bg-gray-50 dark:bg-white/[0.02] p-3 rounded-lg border border-gray-100 dark:border-white/5">
            {/* 🖼 THUMBNAIL (Reduced size for compact look) */}
            <div className="w-20 h-20 flex-shrink-0 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
              {fileMeta.isImage && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={selectedReport.file.url}
                  alt="Preview"
                  className="w-full h-full object-contain p-1"
                />
              )}

              {fileMeta.isPdf && (
                <div className="w-8 h-10 bg-red-500 rounded flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-[8px]">PDF</span>
                </div>
              )}

              {fileMeta.isExcel && (
                <div className="w-8 h-10 bg-green-600 rounded flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-[8px]">XLS</span>
                </div>
              )}
            </div>

            {/* ⚙️ INFO & ACTIONS */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {fileMeta.name}
              </p>
              <p className="text-xs text-gray-500 mb-2">
                {fileMeta.isPdf ? "PDF Document" : fileMeta.isExcel ? "Excel Spreadsheet" : "Image File"}
              </p>
              
              <div className="flex items-center gap-2">
                <a
                  href={selectedReport.file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-[11px] font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded transition shadow-sm dark:bg-slate-700 dark:text-white dark:border-slate-600"
                >
                  Open
                </a>
                <a
                  href={selectedReport.file.url}
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
          {selectedReport?.remarks || "No Remarks."}
        </p>
      </section>
    </div>

    {/* ================= FOOTER: STATUS (Aligned with Col 1) ================= */}
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-12">
      <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          Status
        </span>
        <Badge
          color={selectedReport?.status === "active" ? "success" : "error"}
        >
          {selectedReport?.status === "active" ? "Active" : "Inactive"}
        </Badge>
      </div>
      <div className="hidden md:block"></div>
    </div>
  </div>
</ViewModal>

      {/* ================= EDIT MODAL ================= */}
      <EditModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit Cargo Document"
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
  <Select
    options={vessels.map((v) => ({
      value: v.name,
      label: v.name,
    }))}
    value={editData.vesselName}
    onChange={(val) => {
      // ✅ 4. UPDATE ID ON CHANGE
      const selected = vessels.find(v => v.name === val);
      setEditData({ 
          ...editData, 
          vesselName: val, 
          vesselId: selected?._id || "" // Update ID to trigger hook lookup
      });
    }}
  />
                </div>
            <div className="relative">
                  <Label>Voyage No</Label>
                  <Select
                  
                    options={voyageList}
                    placeholder={!editData.vesselId ? "Select a Vessel first" : voyageList.length === 0 ? "No active voyages found" : "Select Voyage"}
                    value={editData.voyageNo}
                    onChange={(val) => setEditData({ ...editData, voyageNo: val })}
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
                      value={editData.status}
                      onChange={(val) =>
                        setEditData({ ...editData, status: val })
                      }
                      className="dark:bg-dark-900"
                    />
                  </div>
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Port Type</Label>
                  <div className="relative">
                    <Select
                      options={portTypeOptions}
                      placeholder="Select Port Type"
                      value={editData.portType}
                      onChange={(val) =>
                        setEditData({ ...editData, portType: val })
                      }
                      className="dark:bg-dark-900"
                    />
                  </div>
                </div>

                <div>
                  <Label>Document Type</Label>
                  <div className="relative">
                    <Select
                      options={docTypeOptions}
                      placeholder="Select Document Type"
                      value={editData.documentType}
                      onChange={(val) =>
                        setEditData({ ...editData, documentType: val })
                      }
                      className="dark:bg-dark-900"
                    />
                  </div>
                </div>
                <div>
                  <Label>Document Date</Label>
                  <Input
                    type="date"
                    value={editData.documentDate}
                    onChange={(e) =>
                      setEditData({ ...editData, documentDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </ComponentCard>

            {/* FILE EDIT SECTION */}
            <ComponentCard title="Document">
              <div className="mt-2">
                <Label className="mb-2 block">
                  {currentFileMeta
                    ? "Replace File  - Max 500 KB"
                    : "Upload File - Max 500 KB"}
                </Label>

                {/* FILE INPUT CONTAINER */}
                <div className="border border-gray-300 rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-gray-700">
                  <input
                    type="file"
                    accept=".pdf, .jpg, .jpeg, .png, .xls, .xlsx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];

                        if (file.size > 500 * 1024) {
                          toast.error("File size must be below 500 KB.");
                          e.target.value = "";
                          return;
                        }

                        setNewFile(file);
                        setPreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 dark:text-gray-400"
                  />
                </div>
              </div>

              {/* --- PREVIEW SECTION --- */}
              {previewUrl && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                  <Label className="mb-3 block text-xs uppercase text-gray-500 font-semibold">
                    {newFile ? "New File Selected" : "Current File"}
                  </Label>

                  <div className="flex flex-row gap-4 items-start">
                    {/* 🖼 THUMBNAIL */}
                    <div className="w-32 h-32 flex-shrink-0 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center overflow-hidden">
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
                      ) : isExcelPreview ? (
                        <div className="flex flex-col items-center justify-center text-center p-2">
                          <div className="w-10 h-12 bg-green-600 rounded flex items-center justify-center shadow-sm mb-1">
                            <span className="text-white font-bold text-[10px]">
                              XLS
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 truncate max-w-[90px]">
                            Spreadsheet
                          </p>
                        </div>
                      ) : (
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
                          {isPdfPreview
                            ? "PDF Document"
                            : isExcelPreview
                            ? "Excel File"
                            : "Image File"}
                        </p>
                      </div>

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
                                       text-white bg-brand-500 hover:bg-brand-500
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
      />
    </>
  );
}
