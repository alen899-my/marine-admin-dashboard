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

// --- Interfaces ---
interface INavigation {
  distanceToGo: number | string;
  etaNextPort: string;
}

interface IDepartureStats {
  robVlsfo: number | string;
  robLsmgo: number | string;
  cargoSummary: string;
}

interface IDepartureReport {
  _id: string;
  vesselName: string;
  voyageId: string;
  portName: string;
  eventTime: string;
  reportDate: string;
  status: string;
  remarks: string;
  navigation?: INavigation;
  departureStats?: IDepartureStats;
}

interface DepartureReportTableProps {
  refresh: number;
  search: string;
  status: string;
  startDate: string;
  endDate: string;
}

export default function DepartureReportTable({
  refresh,
  search,
  status,
  startDate,
  endDate,
}: DepartureReportTableProps) {
  // Apply interfaces to state
  const [reports, setReports] = useState<IDepartureReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  
  const [selectedReport, setSelectedReport] = useState<IDepartureReport | null>(null);
  const [editData, setEditData] = useState<IDepartureReport | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openEdit, setOpenEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const LIMIT = 10;

  /* ================= FORMAT DATE helper ================= */
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

  const formatForInput = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString)
      .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
      .replace(" ", "T")
      .slice(0, 16);
  };

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      header: "S.No",
      render: (_: IDepartureReport, index: number) => index + 1,
    },
    {
      header: "Vessel Name",
      render: (r: IDepartureReport) => r?.vesselName ?? "-",
    },
    {
      header: "Voyage No / ID",
      render: (r: IDepartureReport) => r?.voyageId ?? "-",
    },
    {
      header: "Port",
      render: (r: IDepartureReport) => r?.portName ?? "-",
    },
    {
      header: "Departure Time (IST)",
      render: (r: IDepartureReport) => formatDate(r.eventTime),
    },
    {
      header: "Report Date (IST)",
      render: (r: IDepartureReport) => formatDate(r?.reportDate),
    },
    {
      header: "Status",
      render: (r: IDepartureReport) => {
        const isActive = r.status === "active";
        return (
          <Badge color={isActive ? "success" : "error"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
  ];

  /* ================= FETCH DATA ================= */
  // Wrap in useCallback to fix useEffect dependency
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

      const res = await fetch(`/api/departure-report?${query.toString()}`);

      if (!res.ok) throw new Error();

      const result = await res.json();

      setReports(result.data || []);
      
      if (!result.data || result.data.length === 0) {
        setTotalPages(1);
      } else {
        setTotalPages(result.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
      setReports([]);
      toast.error("Failed to load departure reports");
    } finally {
      setLoading(false);
    }
  }, [LIMIT, search, status, startDate, endDate]);

  async function handleUpdate() {
    if (!selectedReport || !editData) return;

    setSaving(true);

    try {
      const payload = {
        ...editData,
        eventTime: editData.eventTime ? `${editData.eventTime}+05:30` : null,
        reportDate: editData.reportDate ? `${editData.reportDate}+05:30` : null,
        navigation: {
          ...editData.navigation,
          etaNextPort: editData.navigation?.etaNextPort
            ? `${editData.navigation.etaNextPort}+05:30`
            : null,
        },
      };

      const res = await fetch(`/api/departure-report/${selectedReport._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      const { report } = await res.json();

      setReports((prev) =>
        prev.map((r) => (r._id === report._id ? report : r))
      );

      toast.success("Departure report updated");
      setOpenEdit(false);
      setSelectedReport(null);
    } catch {
      toast.error("Failed to update departure report");
    } finally {
      setSaving(false);
    }
  }

  // Filter Trigger
  useEffect(() => {
    fetchReports(1);
    setCurrentPage(1);
  }, [fetchReports]); // Dependency is now safe via useCallback

  // Pagination Trigger
  useEffect(() => {
    fetchReports(currentPage);
  }, [currentPage, fetchReports]);

  // Refresh Trigger
  useEffect(() => {
    fetchReports(1);
    setCurrentPage(1);
  }, [refresh, fetchReports]);


  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  /* ================= ACTIONS ================= */
  function handleView(report: IDepartureReport) {
    setSelectedReport(report);
    setOpenView(true);
  }

  function handleEdit(report: IDepartureReport) {
    setSelectedReport(report);

    // Populate editData with defaults to ensure nested objects exist
    setEditData({
      _id: report._id,
      vesselName: report.vesselName ?? "",
      voyageId: report.voyageId ?? "",
      portName: report.portName ?? "",
      eventTime: formatForInput(report.eventTime),
      reportDate: formatForInput(report.reportDate),
      status: report.status ?? "active",
      remarks: report.remarks ?? "",
      
      navigation: {
        distanceToGo: report.navigation?.distanceToGo ?? 0,
        etaNextPort: formatForInput(report.navigation?.etaNextPort),
      },

      departureStats: {
        robVlsfo: report.departureStats?.robVlsfo ?? 0,
        robLsmgo: report.departureStats?.robLsmgo ?? 0,
        cargoSummary: report.departureStats?.cargoSummary ?? "",
      },
    });

    setOpenEdit(true);
  }

  async function handleDelete() {
    if (!selectedReport) return;

    try {
      const res = await fetch(`/api/departure-report/${selectedReport._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      setReports((prev) => prev.filter((r) => r._id !== selectedReport?._id));

      toast.success("Departure report deleted");
    } catch {
      toast.error("Failed to delete departure report");
    } finally {
      setOpenDelete(false);
      setSelectedReport(null);
    }
  }

  /* ================= RENDER ================= */
  return (
    <>
      <div className="border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900  rounded-xl">
        <div className="max-w-full overflow-x-auto overflow-hidden">
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
              onDelete={(r: IDepartureReport) => {
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
        title="Departure Report Details"
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
              <div>
                <p className="text-gray-500">Vessel Name</p>
                <p className="font-medium">
                  {selectedReport?.vesselName ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Voyage No / ID</p>
                <p className="font-medium">{selectedReport?.voyageId ?? "-"}</p>
              </div>

              <div>
                <p className="text-gray-500">Port Name</p>
                <p className="font-medium">{selectedReport?.portName ?? "-"}</p>
              </div>

              <div>
                <p className="text-gray-500">Departure Time (IST)</p>
                <p className="font-medium">
                  {formatDate(selectedReport?.eventTime)}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Report Date & Time (IST)</p>
                <p className="font-medium">
                  {formatDate(selectedReport?.reportDate)}
                </p>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Voyage Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">Distance to Go (NM)</p>
                <p className="font-medium">
                  {selectedReport?.navigation?.distanceToGo ?? 0} NM
                </p>
              </div>

              <div>
                <p className="text-gray-500">ETA Next Port (IST)</p>
                <p className="font-medium">
                  {formatDate(selectedReport?.navigation?.etaNextPort)}
                </p>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="ROB at Departure">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">ROB - VLSFO (MT)</p>
                <p className="font-medium">
                  {selectedReport?.departureStats?.robVlsfo ?? 0}
                </p>
              </div>

              <div>
                <p className="text-gray-500">ROB - LSMGO (MT)</p>
                <p className="font-medium">
                  {selectedReport?.departureStats?.robLsmgo ?? 0}
                </p>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Cargo Details">
            <p className="text-gray-500">Cargo Loaded / Unloaded</p>
            <p className="break-words">
              {selectedReport?.departureStats?.cargoSummary ?? "-"}
            </p>
          </ComponentCard>

          <ComponentCard title="Remarks">
            <p className="break-words">{selectedReport?.remarks ?? "-"}</p>
          </ComponentCard>
        </div>
      </ViewModal>

      <EditModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit Departure Report"
        loading={saving}
        onSubmit={handleUpdate}
      >
        {editData && (
          <div className="max-h-[70vh] overflow-y-auto p-1 space-y-5">
            {/* GENERAL INFORMATION */}
            <ComponentCard title="General Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                  
                    </span>
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
                  <Label>Voyage No / ID</Label>
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

                <div>
                  <Label>Departure Time (IST)</Label>
                  <Input
                    type="datetime-local"
                    value={editData.eventTime}
                    onChange={(e) =>
                      setEditData({ ...editData, eventTime: e.target.value })
                    }
                  />
                </div>
              </div>
            </ComponentCard>

            {/* VOYAGE DETAILS */}
            <ComponentCard title="Voyage Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Distance to Go (NM)</Label>
                  <Input
                    type="number"
                    value={editData.navigation?.distanceToGo ?? 0}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        navigation: {
                          ...(editData.navigation as INavigation),
                          distanceToGo: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div>
                  <Label>ETA Next Port (IST)</Label>
                  <Input
                    type="datetime-local"
                    value={editData.navigation?.etaNextPort ?? ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        navigation: {
                          ...(editData.navigation as INavigation),
                          etaNextPort: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </ComponentCard>

            {/* ROB */}
            <ComponentCard title="ROB at Departure">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>ROB - VLSFO (MT)</Label>
                  <Input
                    type="number"
                    value={editData.departureStats?.robVlsfo ?? 0}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        departureStats: {
                          ...(editData.departureStats as IDepartureStats),
                          robVlsfo: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div>
                  <Label>ROB - LSMGO (MT)</Label>
                  <Input
                    type="number"
                    value={editData.departureStats?.robLsmgo ?? 0}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        departureStats: {
                          ...(editData.departureStats as IDepartureStats),
                          robLsmgo: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </ComponentCard>

            {/* CARGO */}
            <ComponentCard title="Cargo Details">
              <Label>Cargo Loaded / Unloaded</Label>
              <TextArea
                rows={4}
                value={editData.departureStats?.cargoSummary ?? ""}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    departureStats: {
                      ...(editData.departureStats as IDepartureStats),
                      cargoSummary: e.target.value,
                    },
                  })
                }
              />
            </ComponentCard>
            {/* REMARKS */}
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

      {/* ================= DELETE MODAL ================= */}
      <ConfirmDeleteModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}