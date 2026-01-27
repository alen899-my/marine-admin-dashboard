"use client";

import ComponentCard from "@/components/common/ComponentCard";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import DownloadPdfButton from "@/components/common/DownloadPdfButton";
import EditModal from "@/components/common/EditModal";
import SharePdfButton from "@/components/common/SharePdfButton";
import ViewModal from "@/components/common/ViewModal";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import SearchableSelect from "@/components/form/SearchableSelect";
import Select from "@/components/form/Select";
import CommonReportTable from "@/components/tables/CommonReportTable";
import Badge from "@/components/ui/badge/Badge";
import Tooltip from "@/components/ui/tooltip/Tooltip";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useVoyageLogic } from "@/hooks/useVoyageLogic";
import { Clock, Fuel, Gauge, InfoIcon, Navigation } from "lucide-react";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
// --- Types ---
interface ArrivalStats {
  robVlsfo: number | string;
  robLsmgo: number | string;
  arrivalCargoQtyMt?: number | string; // NEW
}
interface UserRef {
  _id: string;
  fullName: string;
}
interface NorDetails {
  norTime?: string; // NEW
}

interface ArrivalReport {
  _id: string;
  vesselName: string;
  //  FIX: Allow Populated Object
  vesselId:
    | string
    | {
        _id: string;
        name: string;
        company?: { name: string };
      }
    | null;
  voyageId: string | { voyageNo: string; _id: string } | null;
  voyageNo?: string;
  portName: string;
  eventTime: string;
  reportDate: string;
  status: "active" | "inactive";
  remarks?: string;
  arrivalStats?: ArrivalStats;
  norDetails?: NorDetails;
  createdBy?: UserRef;
  updatedBy?: UserRef;
  createdAt?: string;
  updatedAt?: string;
}

interface EditFormData {
  vesselName: string;
  // Use string for the form state (ID for logic, string for display)
  voyageId: string;
  portName: string;
  eventTime: string;
  vesselId: string;
  norTime: string;
  arrivalCargoQty: number | string;
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
  onDataLoad?: (data: ArrivalReport[]) => void;
  vesselId: string; // Added this
  voyageId: string; // Added this
  vesselList: any[]; // Added this
  setTotalCount?: Dispatch<SetStateAction<number>>;
  companyId: string;
  onFilterDataLoad?: (filterData: {
    vessels: any[];
    companies: any[];
    voyages: any[];
  }) => void;
}

interface VoyageMetrics {
  totalTimeHours: number;
  totalDistance: number;
  avgSpeed: number;
  consumedVlsfo: number;
  consumedLsmgo: number;
}

export default function ArrivalReportTable({
  refresh,
  search,
  status,
  startDate,
  endDate,
  onDataLoad,
  vesselId,
  voyageId,
  vesselList,
  setTotalCount,
  companyId,
  onFilterDataLoad,
}: ArrivalReportTableProps) {
  const [reports, setReports] = useState<ArrivalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedFilters = useRef(false);
  const prevFiltersRef = useRef({
    search,
    status,
    startDate,
    endDate,
    vesselId,
    voyageId,
    companyId,
  });
  const [openView, setOpenView] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ArrivalReport | null>(
    null,
  );
  const [voyageList, setVoyageList] = useState<
    { value: string; label: string }[]
  >([]);
  const [editData, setEditData] = useState<EditFormData | null>(null);
  const [editNorSameAsArrival, setEditNorSameAsArrival] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [voyageMetrics, setVoyageMetrics] = useState<VoyageMetrics | null>(
    null,
  );
  const [metricsLoading, setMetricsLoading] = useState(false);

  const LIMIT = 20;
  const { can, isReady } = useAuthorization();
  const canEdit = can("arrival.edit");
  const canDelete = can("arrival.delete");
  const canSeeHistory = can("reports.history.view");

  /* ================= HELPERS (Moved up for usage in Columns) ================= */
  const getVoyageDisplay = (r: ArrivalReport | null) => {
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

  //  NEW HELPER: Get Vessel Name
  const getVesselName = (r: ArrivalReport | null) => {
    if (!r) return "-";
    if (r.vesselId && typeof r.vesselId === "object" && "name" in r.vesselId) {
      return r.vesselId.name;
    }
    return r.vesselName || "-";
  };
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

  // Trimmed Company Name Helper
  const getCompanyName = (r: ArrivalReport) => {
    if (r.vesselId && typeof r.vesselId === "object" && r.vesselId.company) {
      const name = r.vesselId.company.name;
      return name.length > 20 ? `${name.substring(0, 20)}...` : name;
    }
    return "-";
  };

  // Status Badge Helper
  const getStatusBadge = (statusStr: string) => {
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
          <span className="text-xs font-semibold uppercase text-gray-900 dark:text-white">
            {/*  Use Helper */}
            {getVesselName(r)}
          </span>
          <span className="text-xs text-gray-500 uppercase tracking-tighter">
            {/*  Use Helper */}
            ID: {getVoyageDisplay(r)}
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
          {/*  NEW: NOR Time added below Arrival Time */}
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
          {/*  NEW: Cargo Quantity added below Port Name */}
          <div className="text-sm font-medium mt-1">
            Cargo: {r?.arrivalStats?.arrivalCargoQtyMt?.toLocaleString() ?? 0}{" "}
            MT
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
      render: (r: ArrivalReport) => getStatusBadge(r.status), //  Updated Status Badge
    },
  ];

  /* ================= FETCH ================= */
  // useCallback fixes the missing dependency warning
  // src\app\(admin)\(reports)\arrival-report\ArrivalReportTable.tsx

  // Replace your existing fetchReports with this clean version
  const fetchReports = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const shouldFetchFilters = !hasLoadedFilters.current;

        const query = new URLSearchParams({
          page: page.toString(),
          limit: LIMIT.toString(),
          search: search || "",
          status: status || "all",
          startDate: startDate || "",
          endDate: endDate || "",
          vesselId: vesselId || "",
          voyageId: voyageId || "",
          companyId: companyId || "all",
          all: shouldFetchFilters ? "true" : "false",
        });

        const res = await fetch(`/api/arrival-report?${query.toString()}`);
        if (!res.ok) throw new Error();

        const result = await res.json();
        const rawReports = result.data || [];

        setReports(rawReports);
        if (onDataLoad) onDataLoad(rawReports);

        // 🟢 Callback to parent ONLY when data is returned
        if (shouldFetchFilters && result.vessels && onFilterDataLoad) {
          hasLoadedFilters.current = true;
          onFilterDataLoad({
            vessels: result.vessels || [],
            companies: result.companies || [],
            voyages: result.voyages || [],
          });
        }

        if (setTotalCount) setTotalCount(result.pagination?.total || 0);
        setTotalPages(result.pagination?.totalPages || 1);
      } catch (err) {
        console.error(err);
        setReports([]);
        toast.error("Failed to load arrival reports");
      } finally {
        setLoading(false);
      }
    },
    [
      search,
      status,
      startDate,
      endDate,
      onDataLoad,
      vesselId,
      voyageId,
      companyId,
      setTotalCount,
    ],
  );

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile(); // Check on initial load
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    // 1. Detect if the filters actually changed compared to the last render
    const filtersChanged =
      prevFiltersRef.current.search !== search ||
      prevFiltersRef.current.status !== status ||
      prevFiltersRef.current.startDate !== startDate ||
      prevFiltersRef.current.endDate !== endDate ||
      prevFiltersRef.current.vesselId !== vesselId ||
      prevFiltersRef.current.voyageId !== voyageId ||
      prevFiltersRef.current.companyId !== companyId;

    // 2. If filters changed, reset to page 1
    if (filtersChanged) {
      // Update ref with new filter values
      prevFiltersRef.current = {
        search,
        status,
        startDate,
        endDate,
        vesselId,
        voyageId,
        companyId,
      };

      if (currentPage !== 1) {
        setCurrentPage(1);
        return; // Stop here; the currentPage change will re-trigger this effect
      }
    }

    // 3. If we are here, either the page changed or the filters stayed the same
    fetchReports(currentPage);
  }, [
    currentPage,
    refresh,
    fetchReports,
    isReady,
    search,
    status,
    vesselId,
    voyageId,
    companyId,
    startDate,
    endDate,
  ]);

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  /* ================= ACTIONS ================= */
  async function handleView(report: any) {
    setSelectedReport(report);
    setOpenView(true);

    // Use the metrics already attached to the report from the initial fetch
    if (report.metrics) {
      setVoyageMetrics(report.metrics);
    } else {
      setVoyageMetrics(null);
    }
  }

  function handleEdit(report: ArrivalReport) {
    setSelectedReport(report);
    const matchedVessel = vesselList.find(
      (v: any) => v.name === report.vesselName,
    );
    // Check if Arrival and NOR are the same to toggle the checkbox
    const isSame = report.eventTime === report.norDetails?.norTime;
    setEditNorSameAsArrival(isSame);
    const voyageIdString = getVoyageDisplay(report);
    setEditData({
      vesselName: report.vesselName ?? "",
      voyageId: voyageIdString,
      vesselId: matchedVessel?._id || "",
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
  const { suggestedVoyageNo } = useVoyageLogic(
    editData?.vesselId,
    editData?.reportDate,
  );
  useEffect(() => {
    if (
      editData &&
      suggestedVoyageNo !== undefined &&
      suggestedVoyageNo !== editData.voyageId
    ) {
      setEditData((prev) =>
        prev ? { ...prev, voyageId: suggestedVoyageNo } : null,
      );
    }
  }, [suggestedVoyageNo]);
  const memoizedVoyageList = useMemo(() => {
    if (!editData?.vesselId) return [];

    const activeVoyage = vesselList.find(
      (v) => v._id === editData.vesselId,
    )?.activeVoyageNo;
    const options = [];

    if (activeVoyage)
      options.push({ value: activeVoyage, label: activeVoyage });
    if (editData.voyageId && editData.voyageId !== activeVoyage) {
      options.push({ value: editData.voyageId, label: editData.voyageId });
    }

    return options;
  }, [editData?.vesselId, editData?.voyageId, vesselList]);
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
        prev.map((r) => (r._id === report._id ? report : r)),
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
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/arrival-report/${selectedReport._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      setReports((prev) => prev.filter((r) => r._id !== selectedReport._id));
      // Dynamic Update Count
      if (setTotalCount) {
        setTotalCount((prev) => Math.max(0, prev - 1));
      }
      toast.success("Arrival report deleted");
    } catch {
      toast.error("Failed to delete arrival report");
    } finally {
      setOpenDelete(false);
      setSelectedReport(null);
      setIsDeleting(false); //  Stop Loading
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
              <span className="font-bold">
                {" "}
                {getVesselName(selectedReport)}
              </span>
              <span>|</span>
              <span>{getVoyageDisplay(selectedReport)}</span>
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
                  {getVesselName(selectedReport)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">Voyage No / ID</span>
                <span className="font-medium text-right">
                  {getVoyageDisplay(selectedReport)}
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
              <p className="leading-relaxed py-1 font-medium">
                {selectedReport?.remarks || "No Remarks"}
              </p>
            </section>
          </div>
          {/* --- VOYAGE PERFORMANCE SECTION --- */}
          <section className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              {/* Heading with updated color and refined typography */}
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Voyage Performance Summary
              </h3>
            </div>

            {metricsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-24 bg-gray-100 dark:bg-white/5 animate-pulse rounded-2xl"
                  />
                ))}
              </div>
            ) : voyageMetrics ? (
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-slate-100 dark:divide-white/5">
                  {/* Time Metric */}
                  <div className="p-6 flex flex-col gap-2 sm:border-b lg:border-b-0 border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock
                          size={16}
                          className="text-blue-600 dark:text-blue-400"
                        />
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          Total Time
                        </span>
                      </div>
                      <Tooltip
                        content="Total Time = Arrival Time - Departure Time"
                        position={isMobile ? "left" : "right"}
                      >
                        <InfoIcon
                          size={14}
                          className="text-slate-300 hover:text-slate-500 cursor-help transition-colors"
                        />
                      </Tooltip>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">
                          {voyageMetrics.totalTimeHours}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          Hrs
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-500 font-semibold mt-1 w-fit px-2 py-0.5 rounded-md">
                        ≈ {(voyageMetrics.totalTimeHours / 24).toFixed(1)} Days
                      </p>
                    </div>
                  </div>

                  {/* Distance Metric */}
                  <div className="p-6 flex flex-col gap-2 sm:border-b lg:border-b-0 border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Navigation
                          size={16}
                          className="text-indigo-600 dark:text-indigo-400"
                        />
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          Total Distance
                        </span>
                      </div>
                      <Tooltip
                        content="Total Distance = Σ (Distance Last 24h from all Noon Reports)"
                        position={isMobile ? "left" : "top"}
                      >
                        <InfoIcon
                          size={14}
                          className="text-slate-300 hover:text-slate-500 cursor-help"
                        />
                      </Tooltip>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">
                        {voyageMetrics.totalDistance}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        NM
                      </span>
                    </div>
                  </div>

                  {/* Speed Metric */}
                  <div className="p-6 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gauge
                          size={16}
                          className="text-amber-600 dark:text-amber-400"
                        />
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                          Avg Speed
                        </span>
                      </div>
                      <Tooltip
                        content="Avg Speed = Total Distance / Total Time"
                        position={isMobile ? "left" : "top"}
                      >
                        <InfoIcon
                          size={14}
                          className="text-slate-300 hover:text-slate-500 cursor-help"
                        />
                      </Tooltip>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">
                        {voyageMetrics.avgSpeed}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        Kts
                      </span>
                    </div>
                  </div>

                  {/* Fuel Metric */}
                  <div className="p-6 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Fuel
                          size={16}
                          className="text-emerald-600 dark:text-emerald-400"
                        />
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          Consumption
                        </span>
                      </div>
                      <Tooltip
                        content="Consumed = (Dep ROB + Bunkers) - Arr ROB"
                        position="left"
                      >
                        <InfoIcon
                          size={14}
                          className="text-slate-300 hover:text-slate-500 cursor-help"
                        />
                      </Tooltip>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          VLSFO
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {voyageMetrics.consumedVlsfo}{" "}
                          <span className="text-[10px] text-slate-400 font-normal">
                            MT
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          LSMGO
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {voyageMetrics.consumedLsmgo}{" "}
                          <span className="text-[10px] text-slate-400 font-normal">
                            MT
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50/30 dark:bg-white/[0.01]">
                <div className="p-3 bg-white dark:bg-white/5 shadow-sm rounded-full mb-4">
                  <InfoIcon size={24} className="text-slate-300" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  Missing Departure Data
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-[280px] leading-relaxed">
                  A Departure Report is required to calculate performance
                  metrics. Please link your reports to see analytics.
                </p>
              </div>
            )}
          </section>
          {/* Place this at the bottom of the grid, before the Voyage Performance Section */}
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
          {/* FOOTER: STATUS & SHARE */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-12">
            {/* STATUS */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Status
              </span>
              {getStatusBadge(selectedReport?.status || "")}
            </div>

            {/* ACTIONS (DOWNLOAD & SHARE) */}
            <div className="pt-4 md:pt-0 flex flex-col md:items-end gap-3">
              {selectedReport && (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {/* 1. DOWNLOAD BUTTON */}
                  <DownloadPdfButton
                    title={`Arrival Report - ${getVesselName(selectedReport)}`}
                    filename={`ArrivalReport_${
                      selectedReport.portName
                    }_${getVoyageDisplay(selectedReport)}`}
                    buttonLabel="Download Report"
                    data={{
                      // --- General Information ---
                      "Report Status":
                        selectedReport.status?.toUpperCase() || "ACTIVE",
                      "Vessel Name": getVesselName(selectedReport),
                      "Voyage ID": getVoyageDisplay(selectedReport),
                      "Port Name": selectedReport.portName,
                      "Report Date": formatDate(selectedReport.reportDate),
                      "Arrival Time": formatDate(selectedReport.eventTime),
                      "NOR Tendered": formatDate(
                        selectedReport.norDetails?.norTime,
                      ),

                      // --- Arrival Stats ---
                      "Cargo Quantity":
                        (selectedReport.arrivalStats?.arrivalCargoQtyMt ||
                          "0") + " MT",
                      "ROB VLSFO":
                        (selectedReport.arrivalStats?.robVlsfo || "0") + " MT",
                      "ROB LSMGO":
                        (selectedReport.arrivalStats?.robLsmgo || "0") + " MT",

                      // --- Voyage Performance Summary ---
                      ...(voyageMetrics
                        ? {
                            "Total Steaming Time": `${
                              voyageMetrics.totalTimeHours
                            } Hrs (~${(
                              voyageMetrics.totalTimeHours / 24
                            ).toFixed(1)} Days)`,
                            "Total Distance": `${voyageMetrics.totalDistance} NM`,
                            "Average Speed": `${voyageMetrics.avgSpeed} Kts`,
                            "Total VLSFO Consumed": `${voyageMetrics.consumedVlsfo} MT`,
                            "Total LSMGO Consumed": `${voyageMetrics.consumedLsmgo} MT`,
                          }
                        : {
                            "Performance Data": "No Departure Report linked",
                          }),

                      // --- Remarks ---
                      Remarks: selectedReport.remarks || "No Remarks",
                    }}
                  />

                  {/* 2. SHARE BUTTON */}
                  <SharePdfButton
                    title={`Arrival Report - ${getVesselName(selectedReport)}`}
                    filename={`ArrivalReport_${
                      selectedReport.portName
                    }_${getVoyageDisplay(selectedReport)}`}
                    data={{
                      "Report Status":
                        selectedReport.status?.toUpperCase() || "ACTIVE",
                      "Vessel Name": getVesselName(selectedReport),
                      "Voyage ID": getVoyageDisplay(selectedReport),
                      "Port Name": selectedReport.portName,
                      "Report Date": formatDate(selectedReport.reportDate),
                      "Arrival Time": formatDate(selectedReport.eventTime),
                      "NOR Tendered": formatDate(
                        selectedReport.norDetails?.norTime,
                      ),

                      "Cargo Quantity":
                        (selectedReport.arrivalStats?.arrivalCargoQtyMt ||
                          "0") + " MT",
                      "ROB VLSFO":
                        (selectedReport.arrivalStats?.robVlsfo || "0") + " MT",
                      "ROB LSMGO":
                        (selectedReport.arrivalStats?.robLsmgo || "0") + " MT",

                      ...(voyageMetrics
                        ? {
                            "Total Steaming Time": `${
                              voyageMetrics.totalTimeHours
                            } Hrs (~${(
                              voyageMetrics.totalTimeHours / 24
                            ).toFixed(1)} Days)`,
                            "Total Distance": `${voyageMetrics.totalDistance} NM`,
                            "Average Speed": `${voyageMetrics.avgSpeed} Kts`,
                            "Total VLSFO Consumed": `${voyageMetrics.consumedVlsfo} MT`,
                            "Total LSMGO Consumed": `${voyageMetrics.consumedLsmgo} MT`,
                          }
                        : {
                            "Performance Data": "No Departure Report linked",
                          }),

                      Remarks: selectedReport.remarks || "No Remarks",
                    }}
                  />
                </div>
              )}
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

                <div>
                  <Label>Vessel Name</Label>
                  <SearchableSelect
                    options={vesselList.map((v: any) => ({
                      value: v.name,
                      label: v.name,
                    }))}
                    placeholder="Select or search Vessel"
                    value={editData.vesselName}
                    onChange={(selectedName) => {
                      const selectedVessel = vesselList.find(
                        (v: any) => v.name === selectedName,
                      );

                      setEditData({
                        ...editData,
                        vesselName: selectedName,
                        vesselId: selectedVessel?._id || "",
                        voyageId: "", // 🔥 RESET voyage when vessel changes
                      });
                    }}
                  />
                </div>

                <div className="relative">
                  <Label>Voyage No / ID</Label>
                  <SearchableSelect
                    options={memoizedVoyageList}
                    placeholder={
                      !editData.vesselId
                        ? "Select Vessel first"
                        : memoizedVoyageList.length === 0
                          ? "No active voyages found"
                          : "Search Voyage"
                    }
                    value={editData.voyageId}
                    onChange={(val) =>
                      setEditData({ ...editData, voyageId: val })
                    }
                  />
                </div>

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
                      <Checkbox
                        id="editNorSync"
                        label="Same as Arrival"
                        checked={editNorSameAsArrival}
                        variant="default"
                        onChange={(checked) => {
                          setEditNorSameAsArrival(checked);
                          if (checked) {
                            setEditData({
                              ...editData,
                              norTime: editData.eventTime,
                            });
                          }
                        }}
                      />
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

            <ComponentCard title="Voyage Performance Summary">
              {/* --- VOYAGE PERFORMANCE SECTION --- */}
              <section>
                {metricsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="h-24 bg-gray-100 dark:bg-white/5 animate-pulse rounded-2xl"
                      />
                    ))}
                  </div>
                ) : voyageMetrics ? (
                  <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-slate-100 dark:divide-white/5">
                      {/* Time Metric */}
                      <div className="p-6 flex flex-col gap-2 sm:border-b lg:border-b-0 border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock
                              size={16}
                              className="text-blue-600 dark:text-blue-400"
                            />
                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                              Total Time
                            </span>
                          </div>
                          <Tooltip
                            content="Total Time = Arrival Time - Departure Time"
                            position={isMobile ? "left" : "right"}
                          >
                            <InfoIcon
                              size={14}
                              className="text-slate-300 hover:text-slate-500 cursor-help transition-colors"
                            />
                          </Tooltip>
                        </div>
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">
                              {voyageMetrics.totalTimeHours}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                              Hrs
                            </span>
                          </div>
                          <p className="text-[11px] text-blue-500 font-semibold mt-1 w-fit px-2 py-0.5 rounded-md">
                            ≈ {(voyageMetrics.totalTimeHours / 24).toFixed(1)}{" "}
                            Days
                          </p>
                        </div>
                      </div>

                      {/* Distance Metric */}
                      <div className="p-6 flex flex-col gap-2 sm:border-b lg:border-b-0 border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Navigation
                              size={16}
                              className="text-indigo-600 dark:text-indigo-400"
                            />
                            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                              Total Distance
                            </span>
                          </div>
                          <Tooltip
                            content="Total Distance = Σ (Distance Last 24h from all Noon Reports)"
                            position={isMobile ? "left" : "top"}
                          >
                            <InfoIcon
                              size={14}
                              className="text-slate-300 hover:text-slate-500 cursor-help"
                            />
                          </Tooltip>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-slate-900 dark:text-white">
                            {voyageMetrics.totalDistance}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            NM
                          </span>
                        </div>
                      </div>

                      {/* Speed Metric */}
                      <div className="p-6 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Gauge
                              size={16}
                              className="text-amber-600 dark:text-amber-400"
                            />
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                              Avg Speed
                            </span>
                          </div>
                          <Tooltip
                            content="Avg Speed = Total Distance / Total Time"
                            position={isMobile ? "left" : "top"}
                          >
                            <InfoIcon
                              size={14}
                              className="text-slate-300 hover:text-slate-500 cursor-help"
                            />
                          </Tooltip>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-slate-900 dark:text-white">
                            {voyageMetrics.avgSpeed}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            Kts
                          </span>
                        </div>
                      </div>

                      {/* Fuel Metric */}
                      <div className="p-6 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Fuel
                              size={16}
                              className="text-emerald-600 dark:text-emerald-400"
                            />
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                              Consumption
                            </span>
                          </div>
                          <Tooltip
                            content="Consumed = (Dep ROB + Bunkers) - Arr ROB"
                            position="left"
                          >
                            <InfoIcon
                              size={14}
                              className="text-slate-300 hover:text-slate-500 cursor-help"
                            />
                          </Tooltip>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              VLSFO
                            </span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {voyageMetrics.consumedVlsfo}{" "}
                              <span className="text-[10px] text-slate-400 font-normal">
                                MT
                              </span>
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              LSMGO
                            </span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {voyageMetrics.consumedLsmgo}{" "}
                              <span className="text-[10px] text-slate-400 font-normal">
                                MT
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty State */
                  <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50/30 dark:bg-white/[0.01]">
                    <div className="p-3 bg-white dark:bg-white/5 shadow-sm rounded-full mb-4">
                      <InfoIcon size={24} className="text-slate-300" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                      Missing Departure Data
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-[280px] leading-relaxed">
                      A Departure Report is required to calculate performance
                      metrics. Please link your reports to see analytics.
                    </p>
                  </div>
                )}
              </section>
            </ComponentCard>
          </div>
        )}
      </EditModal>

      {/* ================= DELETE ================= */}
      <ConfirmDeleteModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
        loading={isDeleting}
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
