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
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuthorization } from "@/hooks/useAuthorization";
// --- Types ---
interface ArrivalStats {
  robVlsfo: number | string;
  robLsmgo: number | string;
  arrivalCargoQtyMt?: number | string; // NEW
}

interface NorDetails {
  norTime?: string; // NEW
}

interface ArrivalReport {
  _id: string;
  vesselName: string;
  voyageId: string;
  portName: string;
  eventTime: string;
  reportDate: string;
  status: "active" | "inactive";
  remarks?: string;
  arrivalStats?: ArrivalStats;
  norDetails?: NorDetails; // NEW
}

// Interface for the data structure used during editing
interface EditFormData {
  vesselName: string;
  voyageId: string;
  portName: string;
  eventTime: string;
  norTime: string; // NEW
  arrivalCargoQty: number | string; // NEW
  reportDate: string;
  status: string;
  remarks: string;
  arrivalStats: ArrivalStats;
}

interface ArrivalReportTableProps {
  refresh: number;
  search: string;
  status: string;
  startDate: string;
  endDate: string;
}

export default function ArrivalReportTable({
  refresh,
  search,
  status,
  startDate,
  endDate,
}: ArrivalReportTableProps) {
  const [reports, setReports] = useState<ArrivalReport[]>([]);
  const [loading, setLoading] = useState(true);

  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [selectedReport, setSelectedReport] = useState<ArrivalReport | null>(
    null
  );
  const [editData, setEditData] = useState<EditFormData | null>(null);
  const [editNorSameAsArrival, setEditNorSameAsArrival] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const LIMIT = 20;
  const { can, isReady } = useAuthorization();
    const canEdit = can("arrival.edit");
    const canDelete = can("arrival.delete");

  /* ================= HELPERS (Moved up for usage in Columns) ================= */

  // Display Helper forced to IST
  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  };

  // Helper to format string for Input type="datetime-local" in IST
  const formatForInput = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString)
      .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
      .replace(" ", "T")
      .slice(0, 16);
  };

  /* ================= COLUMNS ================= */
  const columns = [
  {
    header: "S.No",
    render: (_: ArrivalReport, index: number) =>
      (currentPage - 1) * LIMIT + index + 1,
  },
  {
    header: "Vessel & Voyage ID",
    render: (r: ArrivalReport) => (
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-gray-900 dark:text-white">
          {r?.vesselName ?? "-"}
        </span>
        <span className="text-xs text-gray-500 uppercase tracking-tighter">
          ID: {r?.voyageId ?? "-"}
        </span>
      </div>
    ),
  },
  {
    header: "Report & Arrival",
    render: (r: ArrivalReport) => (
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
            Arrival Time
          </span>
          <span className="text-gray-700 dark:text-gray-300">
            {formatDate(r.eventTime)}
          </span>
        </div>
        {/* ✅ NEW: NOR Time added below Arrival Time */}
        {r?.norDetails?.norTime && (
          <div className="flex flex-col pt-1 border-t border-dashed border-gray-100 dark:border-white/5">
            <span className="text-[10px] text-gray-400 uppercase font-bold">
              NOR Tendered
            </span>
            <span className="text-gray-700 dark:text-gray-300">
              {formatDate(r.norDetails.norTime)}
            </span>
          </div>
        )}
      </div>
    ),
  },
  {
    header: "Port",
    render: (r: ArrivalReport) => (
      <div className="flex flex-col">
        <div className="font-bold text-xs">{r?.portName ?? "-"}</div>
        {/* ✅ NEW: Cargo Quantity added below Port Name */}
        <div className="text-sm font-medium mt-1">
          Cargo: {r?.arrivalStats?.arrivalCargoQtyMt?.toLocaleString() ?? 0} MT
        </div>
      </div>
    ),
  },
  {
    header: "ROB & Remarks",
    render: (r: ArrivalReport) => (
      <div className="flex flex-col text-xs gap-1">
        <div className="flex gap-2">
          <span className="bg-gray-100 dark:bg-white/5 px-1.5 rounded text-gray-600 dark:text-gray-300">
            VLSFO: <b>{r?.arrivalStats?.robVlsfo ?? 0} MT</b>
          </span>
          <span className="bg-gray-100 dark:bg-white/5 px-1.5 rounded text-gray-600 dark:text-gray-300">
            LSMGO: <b>{r?.arrivalStats?.robLsmgo ?? 0} MT</b>
          </span>
        </div>
        <p
          className="text-[11px] text-gray-500 line-clamp-1 max-w-[200px]"
          title={r?.remarks}
        >
          {r?.remarks || "No remarks"}
        </p>
      </div>
    ),
  },
  {
    header: "Status",
    render: (r: ArrivalReport) => (
      <Badge color={r.status === "active" ? "success" : "error"}>
        {r.status === "active" ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];

  /* ================= FETCH ================= */
  // useCallback fixes the missing dependency warning
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

        const res = await fetch(`/api/arrival-report?${query.toString()}`);

        if (!res.ok) throw new Error();

        const result = await res.json();

        setReports(result.data);

        if (!result.data || result.data.length === 0) {
          setTotalPages(1);
        } else {
          setTotalPages(result.pagination.totalPages);
        }
      } catch {
        setReports([]);
        setTotalPages(1);
        toast.error("Failed to load arrival reports");
      } finally {
        setLoading(false);
      }
    },
    [search, status, startDate, endDate]
  ); // Dependencies for fetchReports

  // Trigger fetch when filters change (Reset to page 1)
  useEffect(() => {
    fetchReports(1);
    setCurrentPage(1);
  }, [fetchReports]);

  // Trigger fetch when page changes
  useEffect(() => {
    // We strictly check currentPage > 1 to avoid double fetching
    // because the first useEffect handles the initial load (page 1)
    if (currentPage > 1) {
      fetchReports(currentPage);
    }
  }, [currentPage, fetchReports]);

  // Trigger fetch when parent forces refresh
  useEffect(() => {
    if (refresh) {
      fetchReports(1);
      setCurrentPage(1);
    }
  }, [refresh, fetchReports]);

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  /* ================= ACTIONS ================= */
  function handleView(report: ArrivalReport) {
    setSelectedReport(report);
    setOpenView(true);
  }

  function handleEdit(report: ArrivalReport) {
    setSelectedReport(report);

    // Check if Arrival and NOR are the same to toggle the checkbox
    const isSame = report.eventTime === report.norDetails?.norTime;
    setEditNorSameAsArrival(isSame);

    setEditData({
      vesselName: report.vesselName ?? "",
      voyageId: report.voyageId ?? "",
      portName: report.portName ?? "",
      eventTime: formatForInput(report.eventTime),
      norTime: formatForInput(report.norDetails?.norTime), // NEW
      arrivalCargoQty: report.arrivalStats?.arrivalCargoQtyMt ?? 0, // NEW
      reportDate: formatForInput(report.reportDate),
      arrivalStats: {
        robVlsfo: report.arrivalStats?.robVlsfo ?? 0,
        robLsmgo: report.arrivalStats?.robLsmgo ?? 0,
      },
      remarks: report.remarks ?? "",
      status: report.status ?? "active",
    });

    setOpenEdit(true);
  }

  async function handleUpdate() {
    if (!selectedReport || !editData) return;

    setSaving(true);

    try {
      const payload = {
        ...editData,
        robVlsfo: editData.arrivalStats.robVlsfo,
        robLsmgo: editData.arrivalStats.robLsmgo,
        reportDate: editData.reportDate ? `${editData.reportDate}+05:30` : null,
        arrivalTime: editData.eventTime ? `${editData.eventTime}+05:30` : null,
        norTime: editData.norTime ? `${editData.norTime}+05:30` : null, // NEW
        arrivalCargoQty: Number(editData.arrivalCargoQty), // NEW
      };

      const res = await fetch(`/api/arrival-report/${selectedReport._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      const { report } = await res.json();

      setReports((prev) =>
        prev.map((r) => (r._id === report._id ? report : r))
      );

      toast.success("Arrival report updated");
      setOpenEdit(false);
      setSelectedReport(null);
    } catch {
      toast.error("Failed to update arrival report");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedReport) return;

    try {
      const res = await fetch(`/api/arrival-report/${selectedReport._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      setReports((prev) => prev.filter((r) => r._id !== selectedReport._id));
      toast.success("Arrival report deleted");
    } catch {
      toast.error("Failed to delete arrival report");
    } finally {
      setOpenDelete(false);
      setSelectedReport(null);
    }
  }
    if (!isReady) return null;
  /* ================= RENDER ================= */
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
      ? (r: ArrivalReport) => {
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

      {/* ================= VIEW ================= */}
      <ViewModal
        isOpen={openView}
        onClose={() => setOpenView(false)}
        title="Arrival Report Details"
        headerRight={
          selectedReport && (
            <div className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
              <span className="font-bold">{selectedReport.vesselName}</span>
              <span>|</span>
              <span>{selectedReport.voyageId}</span>
            </div>
          )
        }
      >
        <div className="text-[13px] py-1">
          {/* ================= MAIN CONTENT GRID ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {/* ================= SECTION 1: GENERAL INFORMATION ================= */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                General Information
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Vessel Name</span>
                <span className="font-medium text-right">
                  {selectedReport?.vesselName ?? "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Voyage No / ID</span>
                <span className="font-medium text-right">
                  {selectedReport?.voyageId ?? "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Port Name</span>
                <span className="font-medium text-right">
                  {selectedReport?.portName ?? "-"}
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

            {/* ================= SECTION 2: ARRIVAL & NOR DETAILS ================= */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                Arrival & NOR Details
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Arrival Time</span>
                <span className="font-medium text-right">
                  {formatDate(selectedReport?.eventTime)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">NOR Time</span>
                <span className="font-medium text-right">
                  {formatDate(selectedReport?.norDetails?.norTime)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">
                  Cargo on Board (MT)
                </span>
                <span className="font-bold text-right">
                  {selectedReport?.arrivalStats?.arrivalCargoQtyMt?.toLocaleString() ??
                    0}{" "}
                  MT
                </span>
              </div>
            </section>

            {/* ================= SECTION 3: ROB ON ARRIVAL ================= */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                ROB on Arrival
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">
                  Arrival ROB - VLSFO (MT)
                </span>
                <span className="font-medium text-right">
                  {selectedReport?.arrivalStats?.robVlsfo ?? 0}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">
                  Arrival ROB - LSMGO (MT)
                </span>
                <span className="font-medium text-right">
                  {selectedReport?.arrivalStats?.robLsmgo ?? 0}
                </span>
              </div>
            </section>

            {/* ================= SECTION 4: REMARKS ================= */}
            <section className="md:col-span-1">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 border-b">
                Remarks
              </h3>
              <p className="text-gray-700 leading-relaxed py-1 font-medium italic">
                {selectedReport?.remarks || "No Remarks"}
              </p>
            </section>
          </div>

          {/* ================= FOOTER: STATUS ================= */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-12">
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Status
              </span>
              <Badge
                color={
                  selectedReport?.status === "active" ? "success" : "error"
                }
              >
                {selectedReport?.status === "active" ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>
      </ViewModal>

      {/* ================= EDIT ================= */}
      <EditModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit Arrival Report"
        loading={saving}
        onSubmit={handleUpdate}
      >
        {editData && (
          <div className="max-h-[70vh] overflow-y-auto p-1 space-y-3">
            {/* SECTION 1: GENERAL INFORMATION */}
            <ComponentCard title="General Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Reporting Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={editData.reportDate}
                    onChange={(e) =>
                      setEditData({ ...editData, reportDate: e.target.value })
                    }
                  />
                </div>

                <InputField
                  label="Vessel Name"
                  value={editData.vesselName}
                  onChange={(e) =>
                    setEditData({ ...editData, vesselName: e.target.value })
                  }
                />

                <InputField
                  label="Voyage No / ID"
                  value={editData.voyageId}
                  onChange={(e) =>
                    setEditData({ ...editData, voyageId: e.target.value })
                  }
                />

                <InputField
                  label="Port Name"
                  value={editData.portName}
                  onChange={(e) =>
                    setEditData({ ...editData, portName: e.target.value })
                  }
                />
              </div>
            </ComponentCard>

            {/* SECTION 2: ARRIVAL & NOR DETAILS (Mirrors Add Modal) */}
            <ComponentCard title="Arrival & NOR Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Arrival Time</Label>
                  <Input
                    type="datetime-local"
                    value={editData.eventTime}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditData({
                        ...editData,
                        eventTime: val,
                        norTime: editNorSameAsArrival ? val : editData.norTime,
                      });
                    }}
                  />
                </div>

                <InputField
                  label="Cargo on Board at Arrival (MT)"
                  type="number"
                  value={editData.arrivalCargoQty}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      arrivalCargoQty: e.target.value,
                    })
                  }
                />

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label>NOR Time</Label>
                    <div className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        id="editNorSync"
                        checked={editNorSameAsArrival}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setEditNorSameAsArrival(checked);
                          if (checked) {
                            setEditData({
                              ...editData,
                              norTime: editData.eventTime,
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                      <label
                        htmlFor="editNorSync"
                        className="text-xs text-gray-500 font-medium select-none"
                      >
                        Same as Arrival
                      </label>
                    </div>
                  </div>
                  <Input
                    type="datetime-local"
                    value={editData.norTime}
                    onChange={(e) =>
                      setEditData({ ...editData, norTime: e.target.value })
                    }
                    disabled={editNorSameAsArrival}
                    className={
                      editNorSameAsArrival ? "bg-gray-50 opacity-80" : ""
                    }
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    options={statusOptions}
                    value={editData.status}
                    onChange={(val) =>
                      setEditData({ ...editData, status: val })
                    }
                  />
                </div>
              </div>
            </ComponentCard>

            {/* SECTION 3: ROB ON ARRIVAL */}
            <ComponentCard title="ROB on Arrival">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField
                  label="Arrival ROB - VLSFO (MT)"
                  type="number"
                  value={editData.arrivalStats.robVlsfo}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      arrivalStats: {
                        ...editData.arrivalStats,
                        robVlsfo: e.target.value,
                      },
                    })
                  }
                />

                <InputField
                  label="Arrival ROB - LSMGO (MT)"
                  type="number"
                  value={editData.arrivalStats.robLsmgo}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      arrivalStats: {
                        ...editData.arrivalStats,
                        robLsmgo: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </ComponentCard>

            {/* SECTION 4: REMARKS */}
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

      {/* ================= DELETE ================= */}
      <ConfirmDeleteModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}

/* ================= SMALL INFO COMPONENT ================= */
function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium">{value ?? "-"}</p>
    </div>
  );
}

/* ================= INPUT HELPER ================= */
function InputField({
  label,
  ...props
}: {
  label: string;
} & React.ComponentProps<typeof Input>) {
  return (
    <div>
      <Label>{label}</Label>
      <Input {...props} />
    </div>
  );
}
