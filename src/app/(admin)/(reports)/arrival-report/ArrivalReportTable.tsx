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
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Select from "@/components/form/Select";
import Filters from "@/components/common/Filters";
import { ChevronDownIcon } from "lucide-react";

// --- Types ---
interface ArrivalStats {
  robVlsfo: number | string;
  robLsmgo: number | string;
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
}

// Interface for the data structure used during editing
interface EditFormData {
  vesselName: string;
  voyageId: string;
  portName: string;
  eventTime: string;
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
  
  const [selectedReport, setSelectedReport] = useState<ArrivalReport | null>(null);
  const [editData, setEditData] = useState<EditFormData | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const LIMIT = 10;

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
      render: (_: ArrivalReport, index: number) => index + 1,
    },
    {
      header: "Vessel Name",
      render: (r: ArrivalReport) => r?.vesselName ?? "-",
    },
    {
      header: "Voyage No / ID",
      render: (r: ArrivalReport) => r?.voyageId ?? "-",
    },
    {
      header: "Port",
      render: (r: ArrivalReport) => r?.portName ?? "-",
    },
    {
      header: "Arrival Time (IST)",
      render: (r: ArrivalReport) => formatDate(r.eventTime),
    },
    {
      header: "Report Date & Time (IST)",
      render: (r: ArrivalReport) => formatDate(r?.reportDate),
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
  }, [search, status, startDate, endDate]); // Dependencies for fetchReports

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

    setEditData({
      vesselName: report.vesselName ?? "",
      voyageId: report.voyageId ?? "",
      portName: report.portName ?? "",
      eventTime: formatForInput(report.eventTime),
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
        reportDate: editData.reportDate ? `${editData.reportDate}+05:30` : null,
        arrivalTime: editData.eventTime ? `${editData.eventTime}+05:30` : null, 
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
      const res = await fetch(
        `/api/arrival-report/${selectedReport._id}`,
        { method: "DELETE" }
      );

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
              onEdit={handleEdit}
              onDelete={(r: ArrivalReport) => {
                setSelectedReport(r);
                setOpenDelete(true);
              }}
            />
          </div>
        </div>
      </div>

      {/* ================= VIEW ================= */}
      <ViewModal
        isOpen={openView}
        onClose={() => setOpenView(false)}
        title="Arrival Report Details"
      >
        <div className="space-y-6 text-sm">
          <ComponentCard title="Status">
            <Badge
              color={selectedReport?.status === "active" ? "success" : "error"}
            >
              {selectedReport?.status === "active" ? "Active" : "Inactive"}
            </Badge>
          </ComponentCard>

          <ComponentCard title="General Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Info label="Vessel Name" value={selectedReport?.vesselName} />
              <Info label="Voyage No / ID" value={selectedReport?.voyageId} />
              <Info label="Port Name" value={selectedReport?.portName} />

              <Info
                label="Arrival Time (IST)"
                value={formatDate(selectedReport?.eventTime)}
              />
              <Info
                label="Report Date & Time (IST)"
                value={formatDate(selectedReport?.reportDate)}
              />
            </div>
          </ComponentCard>

          <ComponentCard title="ROB on Arrival">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Info
                label="Arrival ROB - VLSFO (MT)"
                value={`${selectedReport?.arrivalStats?.robVlsfo ?? 0}`}
              />
              <Info
                label="Arrival ROB - LSMGO (MT)"
                value={`${selectedReport?.arrivalStats?.robLsmgo ?? 0}`}
              />
            </div>
          </ComponentCard>

          <ComponentCard title="Remarks">
            <p className="break-words">{selectedReport?.remarks ?? "-"}</p>
          </ComponentCard>
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
          <div className="max-h-[70vh] overflow-y-auto p-1 space-y-5">
            <ComponentCard title="General Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Status</Label>
                  <div className="relative">
                    <Select
                      options={statusOptions}
                      value={editData.status}
                      onChange={(val) => setEditData({ ...editData, status: val })}
                      className="dark:bg-dark-900"
                    />
                   
                  </div>
                </div>

                <div>
                  <Label>Report Date & Time (IST)</Label>
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

                <div>
                  <Label>Arrival Time (IST)</Label>
                  <Input
                    type="datetime-local"
                    value={editData.eventTime}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        eventTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </ComponentCard>

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

            <div className="lg:col-span-2">
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