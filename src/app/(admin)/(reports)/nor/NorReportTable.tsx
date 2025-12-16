"use client";

import ComponentCard from "@/components/common/ComponentCard";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import EditModal from "@/components/common/EditModal";
import ViewModal from "@/components/common/ViewModal";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import CommonReportTable from "@/components/tables/CommonReportTable";
import Badge from "@/components/ui/badge/Badge";
// Removed unused Button import
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Select from "@/components/form/Select";
import Filters from "@/components/common/Filters";
import { ChevronDownIcon } from "lucide-react";

// --- Interfaces ---
interface INorDetails {
  tenderTime?: string;
  etaPort?: string;
  pilotStation?: string;
  documentUrl?: string;
}

interface INorReport {
  _id: string;
  vesselName: string;
  voyageId: string;
  portName: string;
  reportDate: string;
  status: string;
  remarks: string;
  norDetails?: INorDetails;
}

// Interface for the flat structure used in the Edit Form
interface IEditNorData {
  status: string;
  vesselName: string;
  voyageId: string;
  portName: string;
  remarks: string;
  reportDate: string;
  pilotStation: string;
  norTenderTime: string;
  etaPort: string;
}

interface NORReportTableProps {
  refresh: number;
}

export default function NorReportTable({ refresh }: NORReportTableProps) {
  // Apply interfaces
  const [reports, setReports] = useState<INorReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  // Selection States
  const [selectedReport, setSelectedReport] = useState<INorReport | null>(null);
  const [editData, setEditData] = useState<IEditNorData | null>(null);

  // New File State for Edit Mode
  const [newFile, setNewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Removed unused imageError state

  // Pagination & Loading States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  // ✅ Date Filter Addition: Main state for filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const LIMIT = 10;

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

  /* ================= 1. TABLE COLUMNS ================= */
  const columns = [
    {
      header: "S.No",
      render: (_: INorReport, index: number) =>
        (currentPage - 1) * LIMIT + index + 1,
    },
    {
      header: "Vessel Name",
      render: (r: INorReport) => r?.vesselName ?? "-",
    },
    {
      header: "Voyage No",
      render: (r: INorReport) => r?.voyageId ?? "-",
    },
    {
      header: "Port",
      render: (r: INorReport) => r?.portName ?? "-",
    },

    {
      header: "NOR Tender Time",
      render: (r: INorReport) => formatDate(r.norDetails?.tenderTime),
    },
    {
      header: "Report Date & Time(IST) ",
      render: (r: INorReport) => formatDate(r.reportDate),
    },
    {
      header: "Status",
      render: (r: INorReport) => {
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

  // Wrapped in useCallback to fix useEffect dependency
  const fetchReports = useCallback(async (page = 1) => {
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

      const res = await fetch(`/api/nor?${query.toString()}`);

      if (!res.ok) throw new Error(`Error: ${res.status}`);

      const result = await res.json();
      setReports(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [LIMIT, search, status, startDate, endDate]);

  // UPDATED: Now sends FormData because the Backend PATCH route expects it
  async function handleUpdate() {
    if (!selectedReport || !editData) return;
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("status", editData.status);
      formData.append("vesselName", editData.vesselName);
      formData.append("voyageNo", editData.voyageId);
      formData.append(
        "reportDate",
        editData.reportDate ? `${editData.reportDate}+05:30` : ""
      );
      formData.append("portName", editData.portName);
      formData.append("remarks", editData.remarks);
      formData.append("pilotStation", editData.pilotStation);
      formData.append(
        "norTenderTime",
        editData.norTenderTime ? `${editData.norTenderTime}+05:30` : ""
      );
      formData.append(
        "etaPort", 
        editData.etaPort ? `${editData.etaPort}+05:30` : ""
      );

      // Append new file if selected
      if (newFile) {
        formData.append("norDocument", newFile);
      }

      const res = await fetch(`/api/nor/${selectedReport._id}`, {
        method: "PATCH",
        body: formData, // Sending FormData instead of JSON
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Update failed");
      }

      const { report } = await res.json();

      setReports((prev) =>
        prev.map((r) => (r._id === report._id ? report : r))
      );

      toast.success("Record updated successfully");
      setOpenEdit(false);
      setSelectedReport(null);
      setNewFile(null); // Clear file state
      setPreviewUrl(null);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to update record";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedReport) return;

    try {
      const res = await fetch(`/api/nor/${selectedReport._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      setReports((prev) => prev.filter((r) => r._id !== selectedReport?._id));
      toast.success("Record deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete record");
    } finally {
      setOpenDelete(false);
      setSelectedReport(null);
    }
  }

  // ✅ Date Filter Addition: Added dates to dependency array to refetch on change
  useEffect(() => {
    fetchReports(1);
    setCurrentPage(1);
  }, [fetchReports]);

  useEffect(() => {
    fetchReports(currentPage);
  }, [currentPage, fetchReports]);

  useEffect(() => {
    fetchReports(1);
    setCurrentPage(1);
  }, [refresh, fetchReports]);

  /* ================= HELPER: FILE META EXTRACTION ================= */
  const getFileMeta = (url?: string) => {
    if (!url) return { name: "", isPdf: false, isImage: false };
    const name = url.split("/").pop() || "Document";
    const isPdf = name.toLowerCase().endsWith(".pdf");
    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(name);
    return { name, isPdf, isImage };
  };

  /* ================= HANDLERS ================= */
  function handleView(report: INorReport) {
    setSelectedReport(report);
    setOpenView(true);
  }

  function handleEdit(report: INorReport) {
    setSelectedReport(report);
    setNewFile(null);
    // Set initial preview to existing document URL
    setPreviewUrl(report.norDetails?.documentUrl || null);

    setEditData({
      status: report.status ?? "active",
      vesselName: report.vesselName ?? "",
      voyageId: report.voyageId ?? "",
      portName: report.portName ?? "",
      remarks: report.remarks ?? "",
      reportDate: formatForInput(report.reportDate),

      pilotStation: report.norDetails?.pilotStation ?? "",

      norTenderTime: formatForInput(report.norDetails?.tenderTime),

      etaPort: formatForInput(report.norDetails?.etaPort),
    });
    setOpenEdit(true);
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

  return (
    <>
      <Filters
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
      />
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
              onEdit={handleEdit}
              onDelete={(r: INorReport) => {
                setSelectedReport(r);
                setOpenDelete(true);
              }}
            />
          </div>
        </div>
      </div>

      {/* ================= VIEW MODAL ================= */}
      <ViewModal
        isOpen={openView}
        onClose={() => setOpenView(false)}
        title="Notice of Readiness (NOR) Details"
      >
        <div className="space-y-6 text-sm">
          {/* Status */}
          <ComponentCard title="Status">
            <Badge
              color={selectedReport?.status === "active" ? "success" : "error"}
            >
              {selectedReport?.status === "active" ? "Active" : "Inactive"}
            </Badge>
          </ComponentCard>

          {/* General Info */}
          <ComponentCard title="General Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-xs text-gray-500  font-semibold">
                  Vessel Name
                </p>
                <p className="font-medium">
                  {selectedReport?.vesselName ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500  font-semibold">
                  Voyage No
                </p>
                <p className="font-medium">{selectedReport?.voyageId ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500  font-semibold">
                  Port Name
                </p>
                <p className="font-medium">{selectedReport?.portName ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500  font-semibold">
                  NOR Tender Time
                </p>
                <p className="font-medium">
                  {formatDate(selectedReport?.norDetails?.tenderTime)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold">
                  Report Date & Time
                </p>
                <p className="font-medium">
                  {formatDate(selectedReport?.reportDate)}
                </p>
              </div>
            </div>
          </ComponentCard>

          {/* Location & Documents */}
          <ComponentCard title="Location & Documents">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-xs text-gray-500  font-semibold">
                  Pilot Station
                </p>
                <p className="font-medium">
                  {selectedReport?.norDetails?.pilotStation ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500  font-semibold">ETA Port</p>
                <p className="font-medium">
                  {formatDate(selectedReport?.norDetails?.etaPort)}
                </p>
              </div>
            </div>

            {/* DOCUMENT SECTION */}
            <div className="mt-6 border-t pt-4 border-gray-200 dark:border-white/10">
              <p className="text-xs text-gray-500 dark:text-gray-400  font-semibold mb-3">
                Attached Document
              </p>

              {!fileMeta || !selectedReport?.norDetails?.documentUrl ? (
                <span className="text-gray-400 dark:text-gray-500 text-xs italic">
                  No file attached
                </span>
              ) : (
                <div className="flex flex-row gap-4 items-start">
                  {/* 🖼 THUMBNAIL (Fixed Small Square) */}
                  <div className="w-32 h-32 flex-shrink-0 bg-gray-50 dark:bg-white/[0.03] rounded-lg  dark: flex items-center justify-center overflow-hidden">
                    {fileMeta.isImage && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={selectedReport.norDetails.documentUrl}
                        alt="Preview"
                        className="w-full h-full object-contain p-1"
                      />
                    )}

                    {fileMeta.isPdf && (
                      <div className="flex flex-col items-center justify-center text-center p-2">
                        {/* PDF Icon */}
                        <div className="w-10 h-12 bg-red-500 rounded flex items-center justify-center shadow-sm mb-1">
                          <span className="text-white font-bold text-[10px]">
                            PDF
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 truncate max-w-[90px]">
                          Preview
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ⚙️ INFO & BUTTONS (Side Panel) */}
                  <div className="flex flex-col justify-center h-32 gap-2">
                    {/* File Meta */}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                        {fileMeta.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {fileMeta.isPdf ? "PDF Document" : "Image File"}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href={selectedReport.norDetails.documentUrl}
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
                        href={selectedReport.norDetails.documentUrl}
                        download
                        className="px-4 py-1.5 text-xs font-medium 
                                   text-white bg-brand-500 hover:bg-brand-600
                                   rounded-md transition shadow-sm border border-transparent"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ComponentCard>

          {/* Remarks */}
          <ComponentCard title="Remarks">
            <p className="break-words">
              {selectedReport?.remarks || "No remarks."}
            </p>
          </ComponentCard>
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
          <div className="max-h-[70vh] overflow-y-auto p-1 space-y-5">
            <ComponentCard title="General Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                      <ChevronDownIcon />
                    </span>
                  </div>
                </div>
                <div>
                  <Label>Report Date & Time(IST)</Label>
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
                  <Input
                    value={editData.vesselName}
                    onChange={(e) =>
                      setEditData({ ...editData, vesselName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Voyage No</Label>
                  <Input
                    value={editData.voyageId}
                    onChange={(e) =>
                      setEditData({ ...editData, voyageId: e.target.value })
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
              </div>
            </ComponentCard>

            <ComponentCard title="Timings & Location">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>NOR Tender Time (IST)</Label>
                  <Input
                    type="datetime-local"
                    value={editData.norTenderTime}
                    onChange={(e) =>
                      setEditData({ ...editData, norTenderTime: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>ETA Port (IST)</Label>
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

                  <div className="flex flex-row gap-4 items-start">
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
      />
    </>
  );
}