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
import { useVoyageLogic } from "@/hooks/useVoyageLogic";
// --- Types ---
interface IPosition {
  lat: string;
  long: string;
}

interface INavigation {
  distLast24h: number | string; // Observed Distance (nm)
  engineDist: number | string; // Engine Distance (nm)
  slip: number | string; // Slip (%)
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
  voyageNo: string;
  type: string;
  status: string;
  reportDate: string;
  position?: IPosition;
  navigation?: INavigation;
  consumption?: IConsumption;
  weather?: IWeather;
  remarks?: string;
  vesselId?: string;
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
  const [voyageList, setVoyageList] = useState<{ value: string; label: string }[]>([]);
  const [selectedReport, setSelectedReport] = useState<IDailyNoonReport | null>(
    null
  );

  // Edit data requires a structure similar to the report but mutable for form inputs
  const [editData, setEditData] = useState<IDailyNoonReport | null>(null);

  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;
  const { can, isReady } = useAuthorization();

  const { vessels, suggestedVoyageNo } = useVoyageLogic(
    editData?.vesselId, 
    editData?.reportDate
  );

const canEdit = can("noon.edit");
const canDelete = can("noon.delete");

  // Local state for filters removed (now coming from props)

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  // ***** SYNC LOGIC: Auto-calculate Slip in Edit Modal if distances are edited *****
  useEffect(() => {
    if (!editData?.navigation) return;

    const engineDist = parseFloat(editData.navigation.engineDist as string);
    const obsDist = parseFloat(editData.navigation.distLast24h as string);

    if (!isNaN(engineDist) && engineDist !== 0 && !isNaN(obsDist)) {
      const calculatedSlip = ((engineDist - obsDist) / engineDist) * 100;
      const slipVal = calculatedSlip.toFixed(2);

      if (editData.navigation.slip !== slipVal) {
        setEditData((prev) =>
          prev
            ? {
                ...prev,
                navigation: { ...prev.navigation!, slip: slipVal },
              }
            : null
        );
      }
    } else if (engineDist === 0 || isNaN(engineDist)) {

      if (editData.navigation.slip !== "") {
        setEditData((prev) =>
          prev
            ? {
                ...prev,
                navigation: { ...prev.navigation!, slip: "" },
              }
            : null
        );
      }
    }
  }, [editData?.navigation?.engineDist, editData?.navigation?.distLast24h]);


  useEffect(() => {

    // 1. Modal is open (editData exists)
    // 2. We have a suggestion
    // 3. The suggestion is DIFFERENT from what's currently there
    if (editData && suggestedVoyageNo !== undefined && suggestedVoyageNo !== editData.voyageId) {
 
       
       setEditData(prev => prev ? { ...prev, voyageId: suggestedVoyageNo } : null);
    }
  }, [suggestedVoyageNo]);
  useEffect(() => {
    async function fetchAndFilterVoyages() {
      // Stop if no vessel is selected (in edit data)
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
              v.voyageNo === editData.voyageId;

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
  }, [editData?.vesselId, editData?.vesselName, suggestedVoyageNo, editData?.voyageId]);
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
      render: (_: IDailyNoonReport, index: number) =>
        (currentPage - 1) * LIMIT + index + 1,
    },
    {
      header: "Vessel & Voyage ID",
      render: (r: IDailyNoonReport) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-gray-900 dark:text-white">
            {r?.vesselName ?? "-"}
          </span>
          <span className="text-xs text-gray-500 uppercase">
            {/* ✅ CHANGE THIS: Use voyageNo instead of voyageId */}
            ID: {r?.voyageNo ?? "-"} 
          </span>
        </div>
      ),
    },
    {
      header: "Report Date",
      render: (r: IDailyNoonReport) => (
        <div className="text-[13px] leading-tight text-gray-700 dark:text-gray-300">
          {formatDate(r.reportDate)}
        </div>
      ),
    },
    {
      header: "Position",
      render: (r: IDailyNoonReport) => (
        <div className="flex flex-col text-xs font-mono">
          <span>Lat: {r?.position?.lat ?? "-"}</span>
          <span>Long: {r?.position?.long ?? "-"}</span>
        </div>
      ),
    },
    {
      header: "Navigation",
      render: (r: IDailyNoonReport) => (
        <div className="flex flex-col text-xs leading-relaxed">
          <span className="font-bold">
            Next Port: {r?.navigation?.nextPort ?? "-"}
          </span>
          <span>
            Observed Distance: <b>{r?.navigation?.distLast24h ?? 0}</b> NM
          </span>
          <span>
            Engine Distance: <b>{r?.navigation?.engineDist ?? 0}</b> NM
          </span>
          <span>
            Slip: <b>{r?.navigation?.slip ? `${r.navigation.slip}%` : "-"}</b>
          </span>
        </div>
      ),
    },
    {
      header: "Fuel Consumed (24h)",
      render: (r: IDailyNoonReport) => (
        <div className="flex flex-col text-xs">
          <span>
            VLSFO:{" "}
            <b className="text-gray-900 dark:text-gray-100">
              {r?.consumption?.vlsfo ?? 0}
            </b>{" "}
            MT
          </span>
          <span>
            LSMGO:{" "}
            <b className="text-gray-900 dark:text-gray-100">
              {r?.consumption?.lsmgo ?? 0}
            </b>{" "}
            MT
          </span>
        </div>
      ),
    },
    {
      header: "Weather",
      render: (r: IDailyNoonReport) => (
        <div className="flex flex-col text-xs max-w-[150px]">
          <span className="truncate">Wind: {r?.weather?.wind ?? "-"}</span>
          <span className="truncate text-gray-500">
            Sea: {r?.weather?.seaState ?? "-"}
          </span>
        </div>
      ),
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
    },
    [LIMIT, search, status, startDate, endDate]
  );

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
    
    // Find the vessel object so we can get its ID for the edit state
    const matchedVessel = vessels.find((v) => v.name === report.vesselName);

    setEditData({
      _id: report._id,
      vesselName: report.vesselName ?? "",
      
     
      vesselId: report.vesselId || matchedVessel?._id || "", 

      voyageId: report.voyageNo ?? "", 
      voyageNo: report.voyageNo ?? "",

     
      type: report.type,
      status: report.status,
      reportDate: formatForInput(report.reportDate),

      position: {
        lat: report.position?.lat ?? "",
        long: report.position?.long ?? "",
      },

      navigation: {
        distLast24h: report.navigation?.distLast24h ?? "",
        engineDist: report.navigation?.engineDist ?? "",
        slip: report.navigation?.slip ?? "",
        distToGo: report.navigation?.distToGo ?? "",
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
        reportDate: editData.reportDate ? `${editData.reportDate}+05:30` : null,
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
if (!isReady) return null;
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
  onEdit={canEdit ? handleEdit : undefined}
  onDelete={
    canDelete
      ? (r: IDailyNoonReport) => {
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

      <ViewModal
        isOpen={openView}
        onClose={() => setOpenView(false)}
        title="Noon Report Details"
        headerRight={
          selectedReport && (
            <div className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
              <span className="font-bold">
                {selectedReport.vesselName}
              </span>
              <span>|</span>
              <span>{selectedReport.voyageNo}</span>
            </div>
          )
        }
      >
        <div className="text-[13px] py-1">
          {/* ================= MAIN CONTENT GRID ================= */}
          {/* gap-x-12 is the key for alignment */}
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
                  {selectedReport?.voyageNo ?? "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Report Type</span>
                <span className="font-medium capitalize text-right">
                  {selectedReport?.type ?? "-"}
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

            {/* ================= POSITION ================= */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                Position
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Latitude</span>
                <span className="font-mono font-medium text-right">
                  {selectedReport?.position?.lat ?? "-"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Longitude</span>
                <span className="font-mono font-medium text-right">
                  {selectedReport?.position?.long ?? "-"}
                </span>
              </div>
            </section>

            {/* ================= NAVIGATION ================= */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase border-b mb-2">
                Navigation & Distance
              </h3>
              <div className="flex justify-between">
                <span>Observed Distance </span>
                <span className="font-medium text-right">
                  {selectedReport?.navigation?.distLast24h} NM
                </span>
              </div>
              <div className="flex justify-between">
                <span>Engine Distance </span>
                <span className="font-medium text-right">
                  {selectedReport?.navigation?.engineDist} NM
                </span>
              </div>
              <div className="flex justify-between">
                <span>Distance To Go</span>
                <span className="font-medium text-right">
                  {selectedReport?.navigation?.distToGo} NM
                </span>
              </div>
              <div className="flex justify-between">
                <span>Slip (%)</span>
                <span className="font-medium text-right">
                  {selectedReport?.navigation?.slip
                    ? `${selectedReport.navigation.slip}%`
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Next Port</span>
                <span className="font-medium text-right">
                  {selectedReport?.navigation?.nextPort}
                </span>
              </div>
            </section>

            {/* ================= CONSUMPTION ================= */}
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                Last 24 hrs Fuel Consumed
              </h3>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">VLSFO</span>
                <span className="font-medium text-right">
                  {selectedReport?.consumption?.vlsfo ?? 0} MT
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">LSMGO</span>
                <span className="font-medium text-right">
                  {selectedReport?.consumption?.lsmgo ?? 0} MT
                </span>
              </div>
            </section>

            {/* ================= WEATHER ================= */}
            <section className="md:col-span-2 space-y-1.5">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b">
                Weather Conditions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1.5">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 shrink-0">
                    Wind / Beaufort Scale
                  </span>
                  <span className="font-medium text-right">
                    {selectedReport?.weather?.wind ?? "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 shrink-0">
                    Sea State / Swell
                  </span>
                  <span className="font-medium text-right">
                    {selectedReport?.weather?.seaState ?? "-"}
                  </span>
                </div>
              </div>
              <div className="pt-1">
                <span className="text-gray-500 shrink-0">Weather Remarks</span>
                <p className="text-gray-600 leading-snug font-medium">
                  {selectedReport?.weather?.remarks ?? "-"}
                </p>
              </div>
            </section>

            {/* ================= REMARKS ================= */}
            <section className="md:col-span-2">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 border-b">
                Remarks
              </h3>
              <p className="text-gray-700 leading-relaxed py-1">
                {selectedReport?.remarks ?? "-"}
              </p>
            </section>
          </div>

          {/* ================= FOOTER: STATUS (Aligned with columns above) ================= */}
          {/* We use the same gap-x-12 here to ensure alignment */}
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

            {/* Empty div for the second column on desktop */}
            <div className="hidden md:block"></div>
          </div>
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
          <div className="max-h-[70vh] overflow-y-auto p-1 space-y-3">
            {/* ================= GENERAL INFORMATION ================= */}
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
<Select
  options={vessels.map((v) => ({
    value: v.name,
    label: v.name,
  }))}
  value={editData.vesselName}
  onChange={(val) => {
    // 4️⃣ UPDATE ID ON CHANGE
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
                  <Label>Voyage No / ID</Label>
                <Select
  options={voyageList}
  placeholder={
    !editData.vesselId
      ? ""
      : voyageList.length === 0
      ? "No active voyages found"
      : "Select Voyage"
  }
  value={editData.voyageNo} // Ensure this matches the options' values
  onChange={(val) => 
    setEditData({ 
      ...editData, 
      voyageNo: val, // ✅ Update the string so the dropdown reflects the change
      voyageId: val  // Update this too if you send 'voyageId' as the string to the backend
    })
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
                        position: {
                          ...(editData.position as IPosition),
                          lat: e.target.value,
                        },
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
                  <Label>Observed Distance (NM)</Label>
                  <Input
                    type="number"
                    value={editData.navigation?.distLast24h}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        navigation: {
                          ...editData.navigation!,
                          distLast24h: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Engine Distance (NM)</Label>
                  <Input
                    type="number"
                    value={editData.navigation?.engineDist}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        navigation: {
                          ...editData.navigation!,
                          engineDist: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Slip (%)</Label>
                  <Input
                    type="number"
                    value={editData.navigation?.slip}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        navigation: {
                          ...editData.navigation!,
                          slip: e.target.value,
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
                        weather: {
                          ...(editData.weather as IWeather),
                          wind: e.target.value,
                        },
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
