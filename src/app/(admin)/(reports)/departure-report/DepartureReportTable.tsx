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
  distanceToNextPortNm: number | string;
  etaNextPort: string;
}

interface IDepartureStats {
  robVlsfo: number | string;
  robLsmgo: number | string;
  bunkersReceivedVlsfo: number | string; // New
  bunkersReceivedLsmgo: number | string; // New
  cargoQtyLoadedMt: number | string; // New
  cargoQtyUnloadedMt: number | string; // New
  cargoSummary: string;
}

interface IDepartureReport {
  _id: string;
  vesselName: string;
  voyageId: string;
  portName: string;
  lastPort: string;
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

  const [selectedReport, setSelectedReport] = useState<IDepartureReport | null>(
    null
  );
  const [editData, setEditData] = useState<IDepartureReport | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openEdit, setOpenEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const LIMIT = 20;

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
    render: (_: IDepartureReport, index: number) =>
      (currentPage - 1) * LIMIT + index + 1,
  },
  {
    header: "Vessel & Voyage ID",
    render: (r: IDepartureReport) => (
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
    header: "Report & Departure",
    render: (r: IDepartureReport) => (
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
            Departure
          </span>
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            {formatDate(r.eventTime)}
          </span>
        </div>
      </div>
    ),
  },
  {
    header: "Port & Navigation",
    render: (r: IDepartureReport) => (
      <div className="flex flex-col text-xs">
        <div className="flex items-center gap-1 font-bold truncate max-w-[140px]">
          <span className="text-gray-400 font-normal">{r?.lastPort ?? "N/A"}</span>
          <span className="text-blue-500">→</span>
          <span>{r?.portName ?? "-"}</span>
        </div>
        <span className="text-gray-500">
          To Go: {r?.navigation?.distanceToNextPortNm ?? 0} NM
        </span>
        <span className="text-[11px] mt-1 text-gray-600 dark:text-gray-400">
          ETA: {formatDate(r?.navigation?.etaNextPort)}
        </span>
      </div>
    ),
  },
  {
    header: "ROB & Cargo",
    render: (r: IDepartureReport) => (
      <div className="flex flex-col text-xs gap-1">
        {/* ROB & Bunkers Received */}
        <div className="flex gap-2">
          <span className="bg-gray-100 dark:bg-white/5 px-1.5 rounded text-gray-600 dark:text-gray-300">
            VLSFO: <b>{r?.departureStats?.robVlsfo ?? 0}</b> 
            <b className="text-green-600 ml-1">+ {r?.departureStats?.bunkersReceivedVlsfo ?? 0}</b>
          </span>
          <span className="bg-gray-100 dark:bg-white/5 px-1.5 rounded text-gray-600 dark:text-gray-300">
            LSMGO: <b>{r?.departureStats?.robLsmgo ?? 0}</b>
            <b className="text-green-600 ml-1">+ {r?.departureStats?.bunkersReceivedLsmgo ?? 0}</b>
          </span>
        </div>
        {/* Cargo Loaded/Unloaded Quantities */}
        <div className="flex gap-2 text-[10px]">
          <span className="uppercase">Loaded: {r?.departureStats?.cargoQtyLoadedMt ?? 0} MT</span>
          <span className="uppercase">Unloaded: {r?.departureStats?.cargoQtyUnloadedMt ?? 0} MT</span>
        </div>
        <p
          className="text-[11px] text-gray-500 line-clamp-1 max-w-[180px]"
          title={r?.departureStats?.cargoSummary}
        >
          {r?.departureStats?.cargoSummary || "No cargo details"}
        </p>
      </div>
    ),
  },
  {
    header: "Status",
    render: (r: IDepartureReport) => (
      <Badge color={r.status === "active" ? "success" : "error"}>
        {r.status === "active" ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];

  /* ================= FETCH DATA ================= */
  // Wrap in useCallback to fix useEffect dependency
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
    },
    [LIMIT, search, status, startDate, endDate]
  );

  async function handleUpdate() {
    if (!selectedReport || !editData) return;

    setSaving(true);

    try {
      const payload = {
      vesselName: editData.vesselName,
      voyageId: editData.voyageId,
      portName: editData.portName,
      lastPort: editData.lastPort,
      eventTime: editData.eventTime ? `${editData.eventTime}+05:30` : null,
      reportDate: editData.reportDate ? `${editData.reportDate}+05:30` : null,
      status: editData.status,
      remarks: editData.remarks,

      // NEST THESE correctly for the backend
      navigation: {
        distance_to_next_port_nm: Number(editData.navigation?.distanceToNextPortNm),
        etaNextPort: editData.navigation?.etaNextPort
          ? `${editData.navigation.etaNextPort}+05:30`
          : null,
      },

      departureStats: {
        robVlsfo: Number(editData.departureStats?.robVlsfo),
        robLsmgo: Number(editData.departureStats?.robLsmgo),
        bunkers_received_vlsfo_mt: Number(editData.departureStats?.bunkersReceivedVlsfo),
        bunkers_received_lsmgo_mt: Number(editData.departureStats?.bunkersReceivedLsmgo),
        cargo_qty_loaded_mt: Number(editData.departureStats?.cargoQtyLoadedMt),
        cargo_qty_unloaded_mt: Number(editData.departureStats?.cargoQtyUnloadedMt),
        cargoSummary: editData.departureStats?.cargoSummary,
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
      lastPort: report.lastPort ?? "",
      eventTime: formatForInput(report.eventTime),
      reportDate: formatForInput(report.reportDate),
      status: report.status ?? "active",
      remarks: report.remarks ?? "",

      navigation: {
        distanceToNextPortNm: report.navigation?.distanceToNextPortNm ?? 0,
        etaNextPort: formatForInput(report.navigation?.etaNextPort),
      },

      departureStats: {
        robVlsfo: report.departureStats?.robVlsfo ?? 0,
        robLsmgo: report.departureStats?.robLsmgo ?? 0,
        bunkersReceivedVlsfo: report.departureStats?.bunkersReceivedVlsfo ?? 0,
        bunkersReceivedLsmgo: report.departureStats?.bunkersReceivedLsmgo ?? 0,
        cargoQtyLoadedMt: report.departureStats?.cargoQtyLoadedMt ?? 0,
        cargoQtyUnloadedMt: report.departureStats?.cargoQtyUnloadedMt ?? 0,
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
              onRowClick={handleView}
            />
          </div>
        </div>
      </div>

      {/* ================= VIEW MODAL ================= */}
      <ViewModal
        isOpen={openView}
        onClose={() => setOpenView(false)}
        title={`Departure – ${selectedReport?.portName ?? "Port"} Report`}
        headerRight={
          selectedReport && (
            <div className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
              <span className="font-bold">
                {selectedReport.vesselName}
              </span>
              <span>|</span>
              <span>{selectedReport.voyageId}</span>
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
                  {selectedReport?.vesselName ?? "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Voyage No / ID</span>
                <span className="font-medium text-right">
                  {selectedReport?.voyageId ?? "-"}
                </span>
              </div>
              {/* NEW FIELD: Last Port */}
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Last Port</span>
                <span className="font-medium text-right">
                  {selectedReport?.lastPort ?? "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">
                  Current Port Name
                </span>
                <span className="font-medium text-right">
                  {selectedReport?.portName ?? "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Departure Time</span>
                <span className="font-medium text-right">
                  {formatDate(selectedReport?.eventTime)}
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

            {/* ================= VOYAGE DETAILS ================= */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                Voyage Details
              </h3>
              <div className="flex justify-between gap-4">
                {/* UPDATED LABEL */}
                <span className="text-gray-500 shrink-0">
                  Distance to Next Port (NM)
                </span>
                <span className="font-medium text-right">
                  {selectedReport?.navigation?.distanceToNextPortNm ?? 0} NM
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">ETA Next Port</span>
                <span className="font-medium text-right">
                  {formatDate(selectedReport?.navigation?.etaNextPort)}
                </span>
              </div>
            </section>

            {/* ================= ROB AT DEPARTURE ================= */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                Bunkers & ROB at Departure
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">ROB - VLSFO </span>
                <span className="font-medium text-right">
                  {selectedReport?.departureStats?.robVlsfo ?? 0} MT
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">ROB - LSMGO </span>
                <span className="font-medium text-right">
                  {selectedReport?.departureStats?.robLsmgo ?? 0} MT
                </span>
              </div>
              {/* NEW FIELD: Bunkers Received VLSFO */}
              <div className="flex justify-between gap-4 pt-1 border-t border-dashed border-gray-100 dark:border-white/5">
                <span className="text-gray-500 shrink-0">
                  Bunkers Received (VLSFO)
                </span>
                <span className="font-medium text-right">
                  {selectedReport?.departureStats?.bunkersReceivedVlsfo ?? 0} MT
                </span>
              </div>
              {/* NEW FIELD: Bunkers Received LSMGO */}
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">
                  Bunkers Received (LSMGO)
                </span>
                <span className="font-medium text-right">
                  {selectedReport?.departureStats?.bunkersReceivedLsmgo ?? 0} MT
                </span>
              </div>
            </section>

            {/* ================= CARGO DETAILS ================= */}
            <section className="space-y-1.5 md:col-span-1">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                Cargo Details
              </h3>
              {/* NEW FIELDS: Loaded / Unloaded Quantities */}
              <div className="grid grid-cols-2 gap-4 py-1 mb-1 bg-gray-50 dark:bg-white/5 p-2 rounded">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase">
                    Qty Loaded
                  </span>
                  <span className="font-bold">
                    {selectedReport?.departureStats?.cargoQtyLoadedMt ?? 0} MT
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase">
                    Qty Unloaded
                  </span>
                  <span className="font-bold">
                    {selectedReport?.departureStats?.cargoQtyUnloadedMt ?? 0} MT
                  </span>
                </div>
              </div>
              <div className="pt-1">
                <span className="text-gray-500 shrink-0">Cargo Summary</span>
                <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                  {selectedReport?.departureStats?.cargoSummary ?? "-"}
                </p>
              </div>
            </section>

            {/* ================= REMARKS ================= */}
            <section className="md:col-span-2">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 border-b">
                Remarks
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed py-1 font-medium">
                {selectedReport?.remarks || "No Remarks"}
              </p>
            </section>
          </div>

          {/* ================= FOOTER: STATUS ================= */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-12">
            <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
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
            <div className="hidden md:block"></div>
          </div>
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
          <div className="max-h-[70vh] overflow-y-auto p-1 space-y-3">
            {/* GENERAL INFORMATION */}
            <ComponentCard title="General Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                {/* NEW FIELD: Last Port */}
                <div>
                  <Label>Last Port</Label>
                  <Input
                    value={editData.lastPort}
                    placeholder="Enter last port"
                    onChange={(e) =>
                      setEditData({ ...editData, lastPort: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Current Port Name</Label>
                  <Input
                    value={editData.portName}
                    onChange={(e) =>
                      setEditData({ ...editData, portName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Departure Time</Label>
                  <Input
                    type="datetime-local"
                    value={editData.eventTime}
                    onChange={(e) =>
                      setEditData({ ...editData, eventTime: e.target.value })
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

            {/* VOYAGE DETAILS */}
            <ComponentCard title="Voyage Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  {/* RENAMED LABEL */}
                  <Label>Distance to Next Port (NM)</Label>
                  <Input
                    type="number"
                    value={editData.navigation?.distanceToNextPortNm ?? 0}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        navigation: {
                          ...(editData.navigation as INavigation),
                          distanceToNextPortNm: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div>
                  <Label>ETA Next Port</Label>
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

            {/* ROB & BUNKERS */}
            <ComponentCard title="Bunkers & ROB at Departure">
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

                {/* NEW FIELD: Bunkers Received VLSFO */}
                <div>
                  <Label>Bunkers Received - VLSFO (MT)</Label>
                  <Input
                    type="number"
                    value={editData.departureStats?.bunkersReceivedVlsfo ?? 0}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        departureStats: {
                          ...(editData.departureStats as IDepartureStats),
                          bunkersReceivedVlsfo: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                {/* NEW FIELD: Bunkers Received LSMGO */}
                <div>
                  <Label>Bunkers Received - LSMGO (MT)</Label>
                  <Input
                    type="number"
                    value={editData.departureStats?.bunkersReceivedLsmgo ?? 0}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        departureStats: {
                          ...(editData.departureStats as IDepartureStats),
                          bunkersReceivedLsmgo: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </ComponentCard>

            {/* CARGO */}
            <ComponentCard title="Cargo Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                {/* NEW FIELD: Qty Loaded */}
                <div>
                  <Label>Qty Loaded (MT)</Label>
                  <Input
                    type="number"
                    value={editData.departureStats?.cargoQtyLoadedMt ?? 0}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        departureStats: {
                          ...(editData.departureStats as IDepartureStats),
                          cargoQtyLoadedMt: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                {/* NEW FIELD: Qty Unloaded */}
                <div>
                  <Label>Qty Unloaded (MT)</Label>
                  <Input
                    type="number"
                    value={editData.departureStats?.cargoQtyUnloadedMt ?? 0}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        departureStats: {
                          ...(editData.departureStats as IDepartureStats),
                          cargoQtyUnloadedMt: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <Label>Cargo Summary</Label>
              <TextArea
                rows={4}
                value={editData.departureStats?.cargoSummary ?? ""}
                placeholder="Summary of cargo operations..."
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
