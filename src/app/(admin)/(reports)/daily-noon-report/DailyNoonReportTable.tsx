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

// --- Types ---
interface IPosition {
  lat: string;
  long: string;
}

interface INavigation {
  distLast24h: number | string;
  distToGo: number | string;
  nextPort: string;
}

interface IConsumption {
  vlsfo: number | string;
  lsmgo: number | string;
}

interface IWeather {
  wind: string;
  seaState: string;
  remarks: string;
}

interface IDailyNoonReport {
  _id: string;
  vesselName: string;
  voyageId: string;
  type: string;
  status: string;
  reportDate: string;
  position?: IPosition;
  navigation?: INavigation;
  consumption?: IConsumption;
  weather?: IWeather;
  remarks?: string;
}

// Updated Props Interface
interface DailyNoonReportTableProps {
  refresh: number;
  search: string;
  status: string;
  startDate: string;
  endDate: string;
}

export default function DailyNoonReportTable({
  refresh,
  search,
  status,
  startDate,
  endDate,
}: DailyNoonReportTableProps) {
  // Apply interfaces to state
  const [reports, setReports] = useState<IDailyNoonReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [selectedReport, setSelectedReport] = useState<IDailyNoonReport | null>(null);

  // Edit data requires a structure similar to the report but mutable for form inputs
  const [editData, setEditData] = useState<IDailyNoonReport | null>(null);

  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 10;

  // Local state for filters removed (now coming from props)

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  // Helper functions moved up to be available for render
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

  const columns = [
    {
      header: "S.No",
      render: (_: IDailyNoonReport, index: number) => (currentPage - 1) * LIMIT + index + 1,
    },
    {
      header: "Vessel Name",
      render: (r: IDailyNoonReport) => r?.vesselName ?? "-",
    },
    {
      header: "Voyage No / ID",
      render: (r: IDailyNoonReport) => r?.voyageId ?? "-",
    },
    {
      header: "Next Port",
      render: (r: IDailyNoonReport) => r?.navigation?.nextPort ?? "-",
    },
    {
      // ***** CHANGE: Force IST Label *****
      header: "Report Date & Time (IST)",
      render: (r: IDailyNoonReport) => formatDate(r.reportDate),
    },
    {
      header: "Status",
      render: (r: IDailyNoonReport) => (
        <Badge color={r.status === "active" ? "success" : "error"}>
          {r.status === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  // ***** CHANGE: Force IST for input fields *****
  const formatForInput = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString)
      .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
      .replace(" ", "T")
      .slice(0, 16);
  };

  // Wrap fetchReports in useCallback to fix dependency warnings
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

      const res = await fetch(`/api/noon-report?${query.toString()}`);

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
    } finally {
      setLoading(false);
    }
  }, [LIMIT, search, status, startDate, endDate]);

  // Filter Trigger (Search, Status, Dates) - using props now
  useEffect(() => {
    fetchReports(1);
    setCurrentPage(1);
  }, [fetchReports]); // fetchReports dependency already includes search/status/dates

  // Refresh Trigger
  useEffect(() => {
    fetchReports(1);
    setCurrentPage(1);
  }, [refresh, fetchReports]);

  // Pagination Trigger
  useEffect(() => {
    fetchReports(currentPage);
  }, [currentPage, fetchReports]);


  // ACTIONS
  function handleView(report: IDailyNoonReport) {
    setSelectedReport(report);
    setOpenView(true);
  }

  function handleEdit(report: IDailyNoonReport) {
    setSelectedReport(report);

    // Initialize editData with existing values or defaults to avoid null access
    setEditData({
      _id: report._id,
      vesselName: report.vesselName ?? "",
      voyageId: report.voyageId ?? "",
      type: report.type,
      status: report.status,

      // ***** CHANGE: Convert DB Time to IST Input format *****
      reportDate: formatForInput(report.reportDate),

      position: {
        lat: report.position?.lat ?? "",
        long: report.position?.long ?? "",
      },

      navigation: {
        distLast24h: report.navigation?.distLast24h ?? 0,
        distToGo: report.navigation?.distToGo ?? 0,
        nextPort: report.navigation?.nextPort ?? "",
      },

      consumption: {
        vlsfo: report.consumption?.vlsfo ?? 0,
        lsmgo: report.consumption?.lsmgo ?? 0,
      },

      weather: {
        wind: report.weather?.wind ?? "",
        seaState: report.weather?.seaState ?? "",
        remarks: report.weather?.remarks ?? "",
      },

      remarks: report.remarks ?? "",
    });

    setOpenEdit(true);
  }

  async function handleUpdate() {
    if (!selectedReport || !editData) return;

    setSaving(true);

    try {
      // ***** CHANGE: Append +05:30 to payload *****
      const payload = {
        ...editData,
        reportDate: editData.reportDate
          ? `${editData.reportDate}+05:30`
          : null,
      };

      const res = await fetch(`/api/noon-report/${selectedReport._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      const { report } = await res.json();

      setReports((prev) =>
        prev.map((r) => (r._id === report._id ? report : r))
      );

      toast.success("Noon report updated");
      setOpenEdit(false);
      setSelectedReport(null);
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedReport) return;

    try {
      const res = await fetch(`/api/noon-report/${selectedReport._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      setReports((prev) => prev.filter((r) => r._id !== selectedReport?._id));

      toast.success("Noon report deleted successfully");
    } catch {
      toast.error("Failed to delete report");
    } finally {
      setOpenDelete(false);
      setSelectedReport(null);
    }
  }

  return (
    <>
      {/* Filters Removed from here */}
      <div
        className="border border-gray-200 bg-white text-gray-800
                  dark:border-white/10 dark:bg-slate-900 dark:text-gray-100 rounded-xl"
      >
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
              onDelete={(r: IDailyNoonReport) => {
                setSelectedReport(r);
                setOpenDelete(true);
              }}
            />
          </div>
        </div>
      </div>

      <ViewModal
        isOpen={openView}
        onClose={() => setOpenView(false)}
        title="Noon Report Details"
      >
        <div className="space-y-6 text-sm">
          {/* ================= STATUS ================= */}
          <ComponentCard title="Status">
            <Badge
              color={selectedReport?.status === "active" ? "success" : "error"}
            >
              {selectedReport?.status === "active" ? "Active" : "Inactive"}
            </Badge>
          </ComponentCard>

          {/* ================= GENERAL INFORMATION ================= */}
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
                <p className="text-gray-500">Report Type</p>
                <p className="font-medium capitalize">
                  {selectedReport?.type ?? "-"}
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

          {/* ================= POSITION ================= */}
          <ComponentCard title="Position">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">Latitude</p>
                <p className="font-medium">
                  {selectedReport?.position?.lat ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Longitude</p>
                <p className="font-medium">
                  {selectedReport?.position?.long ?? "-"}
                </p>
              </div>
            </div>
          </ComponentCard>

          {/* ================= NAVIGATION ================= */}
          <ComponentCard title="Navigation">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">
                  Distance Travelled (last 24 hrs, NM)
                </p>
                <p className="font-medium">
                  {selectedReport?.navigation?.distLast24h ?? 0} NM
                </p>
              </div>

              <div>
                <p className="text-gray-500">Distance To Go (NM)</p>
                <p className="font-medium">
                  {selectedReport?.navigation?.distToGo ?? 0} NM
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-gray-500">Next Port</p>
                <p className="font-medium">
                  {selectedReport?.navigation?.nextPort ?? "-"}
                </p>
              </div>
            </div>
          </ComponentCard>

          {/* ================= CONSUMPTION ================= */}
          <ComponentCard title="Fuel Consumption">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">Fuel Consumed - VLSFO (MT)</p>
                <p className="font-medium">
                  {selectedReport?.consumption?.vlsfo ?? 0}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Fuel Consumed - LSMGO (MT)</p>
                <p className="font-medium">
                  {selectedReport?.consumption?.lsmgo ?? 0}
                </p>
              </div>
            </div>
          </ComponentCard>

          {/* ================= WEATHER ================= */}
          <ComponentCard title="Weather Conditions">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">Wind / Beaufort Scale</p>
                <p className="font-medium">
                  {selectedReport?.weather?.wind ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Sea State / Swell</p>
                <p className="font-medium">
                  {selectedReport?.weather?.seaState ?? "-"}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-gray-500">Weather Remarks</p>
                <p className="font-medium break-words">
                  {selectedReport?.weather?.remarks ?? "-"}
                </p>
              </div>
            </div>
          </ComponentCard>

          {/* ================= REMARKS ================= */}
          <ComponentCard title="Remarks">
            <p className="break-words">{selectedReport?.remarks ?? "-"}</p>
          </ComponentCard>
        </div>
      </ViewModal>

      <EditModal
        isOpen={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit Daily Noon Report"
        loading={saving}
        onSubmit={handleUpdate}
      >
        {editData && (
          <div className="max-h-[70vh] overflow-y-auto p-1 space-y-5">
            {/* ================= GENERAL INFORMATION ================= */}
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
                  <Label>Next Port</Label>
                  <Input
                    value={editData.navigation?.nextPort || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        navigation: {
                          ...(editData.navigation as INavigation),
                          nextPort: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </ComponentCard>

            {/* ================= POSITION & DISTANCE ================= */}
            <ComponentCard title="Position & Distance">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Latitude</Label>
                  <Input
                    value={editData.position?.lat || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        position: { ...(editData.position as IPosition), lat: e.target.value },
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Longitude</Label>
                  <Input
                    value={editData.position?.long || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        position: {
                          ...(editData.position as IPosition),
                          long: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Distance Travelled (last 24 hrs, NM)</Label>
                  <Input
                    type="number"
                    value={editData.navigation?.distLast24h || 0}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        navigation: {
                          ...(editData.navigation as INavigation),
                          distLast24h: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Distance To Go (NM)</Label>
                  <Input
                    type="number"
                    value={editData.navigation?.distToGo || 0}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        navigation: {
                          ...(editData.navigation as INavigation),
                          distToGo: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </ComponentCard>

            {/* ================= FUEL CONSUMPTION ================= */}
            <ComponentCard title="Fuel Consumption">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Fuel Consumed - VLSFO (MT)</Label>
                  <Input
                    type="number"
                    value={editData.consumption?.vlsfo || 0}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        consumption: {
                          ...(editData.consumption as IConsumption),
                          vlsfo: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Fuel Consumed - LSMGO (MT)</Label>
                  <Input
                    type="number"
                    value={editData.consumption?.lsmgo || 0}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        consumption: {
                          ...(editData.consumption as IConsumption),
                          lsmgo: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </ComponentCard>

            {/* ================= WEATHER ================= */}
            <ComponentCard title="Weather">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label>Wind / Beaufort Scale</Label>
                  <Input
                    value={editData.weather?.wind || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        weather: { ...(editData.weather as IWeather), wind: e.target.value },
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Sea State / Swell</Label>
                  <Input
                    value={editData.weather?.seaState || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        weather: {
                          ...(editData.weather as IWeather),
                          seaState: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Weather Remarks</Label>
                  <TextArea
                    rows={4}
                    value={editData.weather?.remarks || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        weather: {
                          ...(editData.weather as IWeather),
                          remarks: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </ComponentCard>

            {/* ================= GENERAL REMARKS ================= */}
            <div className="lg:col-span-2">
              <ComponentCard title="General Remarks">
                <TextArea
                  rows={4}
                  value={editData.remarks || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, remarks: e.target.value })
                  }
                />
              </ComponentCard>
            </div>
          </div>
        )}
      </EditModal>

      <ConfirmDeleteModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}