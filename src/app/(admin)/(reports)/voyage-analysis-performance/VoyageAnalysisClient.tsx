"use client";

import ComponentCard from "@/components/common/ComponentCard";
import DownloadPdfButton from "@/components/common/DownloadPdfButton";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import SearchableSelect from "@/components/form/SearchableSelect";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Tooltip from "@/components/ui/tooltip/Tooltip";
import {
  Activity,
  AlertTriangle,
  Anchor,
  Fuel,
  Info,
  Minus,
  Navigation,
  Plus,
  Timer,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation"; // ✅ Added
import React, { useEffect, useMemo, useState } from "react";
import { useAuthorization } from "@/hooks/useAuthorization";
// --- Helper for HTML datetime-local format (YYYY-MM-DDTHH:mm) ---
const formatDateTimeLocal = (dateStr: string | Date | undefined) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// --- Types ---
interface NoonReportRow {
  noonDt: string;
  noonNm: number | "";
  noonHrs: number | "";
  noonNote: string;
}

interface VoyageAnalysisClientProps {
  vesselOptions: any[];
  voyageOptions: any[];
  performanceData: any | null;
}

export default function VoyageAnalysisClient({
  vesselOptions,
  voyageOptions,
  performanceData,
}: VoyageAnalysisClientProps) {
   const { can, isReady } = useAuthorization();
    const canView = can("voyageanalysis.view");
   
    
  
    if (!isReady) return null;
  
    if (!canView) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500 font-medium">
            You do not have permission to access Voyage Analysis.
          </p>
        </div>
      );
    }
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- Form State ---
  // Initialize from URL params
  const [vessel, setVessel] = useState(searchParams.get("vesselId") || "");
  const [legId, setLegId] = useState(searchParams.get("voyageId") || "");
  
  const [depDt, setDepDt] = useState("");
  const [arrDt, setArrDt] = useState("");
  const [rfaDt, setRfaDt] = useState("");
  const [plannedNm, setPlannedNm] = useState<number | "">("");

  const [depVlsfo, setDepVlsfo] = useState<number | "">("");
  const [arrVlsfo, setArrVlsfo] = useState<number | "">("");
  const [depLsmgo, setDepLsmgo] = useState<number | "">("");
  const [arrLsmgo, setArrLsmgo] = useState<number | "">("");

  const [noonReports, setNoonReports] = useState<NoonReportRow[]>([
    { noonDt: "", noonNm: "", noonHrs: 24, noonNote: "" },
    { noonDt: "", noonNm: "", noonHrs: 24, noonNote: "" },
  ]);

  const [removedNoonReports, setRemovedNoonReports] = useState<NoonReportRow[]>(
    [],
  );

  // Map dropdown options
  const vesselsList = useMemo(() => vesselOptions.map((v) => ({ value: v._id, label: v.name })), [vesselOptions]);
  const voyagesList = useMemo(() => voyageOptions.map((v) => ({ value: v._id, label: v.voyageNo })), [voyageOptions]);
  
  // New: Loading state is just a UI placeholder for navigation
  const [isDataLoading, setIsDataLoading] = useState(false);

  // --- Sync State with Server Data ---
  useEffect(() => {
    if (performanceData) {
      setDepDt(formatDateTimeLocal(performanceData.operational?.departure?.eventTime));
      setArrDt(formatDateTimeLocal(performanceData.operational?.arrival?.eventTime));
      setPlannedNm(performanceData.operational?.departure?.plannedNm || "");
      setRfaDt(formatDateTimeLocal(performanceData.operational?.departure?.rfaDt));
      setDepVlsfo(performanceData.operational?.departure?.stats?.robVlsfo || "");
      setArrVlsfo(performanceData.operational?.arrival?.stats?.robVlsfo || "");
      setDepLsmgo(performanceData.operational?.departure?.stats?.robLsmgo || "");
      setArrLsmgo(performanceData.operational?.arrival?.stats?.robLsmgo || "");

      if (performanceData.dailyReports) {
        setNoonReports(
          performanceData.dailyReports.map((r: any) => ({
            noonDt: formatDateTimeLocal(r.reportDate),
            noonNm: r.navigation?.distLast24h || 0,
            noonHrs: 24, 
            noonNote: r.weather?.remarks || "",
          })),
        );
        setRemovedNoonReports([]);
      }
    } else if (!legId) {
        // Clear logic if no voyage selected
       handleClear();
    }
    setIsDataLoading(false);
  }, [performanceData, legId]);

  // --- Handlers for URL Navigation ---
  const handleVesselSelect = (val: string) => {
    setVessel(val);
    setLegId("");
    router.push(`?vesselId=${val}`);
  };

  const handleVoyageSelect = (val: string) => {
    setLegId(val);
    setIsDataLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set("voyageId", val);
    router.push(`?${params.toString()}`);
  };

  // --- Performance Calculation Engine (useMemo) - Unchanged ---
  const performance = useMemo(() => {
    // 1. Leg Time Logic
    let days = 0;
    let durationStr = "0d 0h 0m"; 

    if (depDt && arrDt) {
      const diff = new Date(arrDt).getTime() - new Date(depDt).getTime();
      if (diff > 0) {
        const totalDays = diff / (1000 * 60 * 60 * 24);
        const d = Math.floor(totalDays);
        const h = Math.floor((totalDays % 1) * 24);
        const m = Math.round((((totalDays % 1) * 24) % 1) * 60);

        days = parseFloat(totalDays.toFixed(2));
        durationStr = `${d}d ${h}h ${m}m`;
      }
    }

    // 2. Distance & Steam Time Summation
    const totalDist = noonReports.reduce(
      (sum, r) => sum + (Number(r.noonNm) || 0),
      0,
    );
    const totalHrs = noonReports.reduce(
      (sum, r) => sum + (Number(r.noonHrs) || 0),
      0,
    );

    // 3. Speed Logic
    const avgSpeed = totalHrs > 0 ? (totalDist / totalHrs).toFixed(2) : "0.00";

    // 4. Fuel Logic & Validation Flags
    const vlsfoCons = (Number(depVlsfo) || 0) - (Number(arrVlsfo) || 0);
    const lsmgoCons = (Number(depLsmgo) || 0) - (Number(arrLsmgo) || 0);

    const vlsfoPerDay = days > 0 ? (vlsfoCons / days).toFixed(2) : "0.00";
    const lsmgoPerDay = days > 0 ? (lsmgoCons / days).toFixed(2) : "0.00";

    const isVlsfoIncreased =
      Number(arrVlsfo) > Number(depVlsfo) && depVlsfo !== "";
    const isLsmgoIncreased =
      Number(arrLsmgo) > Number(depLsmgo) && depLsmgo !== "";

    return {
      days: days > 0 ? days : "0.0",
      durationStr,
      totalDist: totalDist.toFixed(1),
      avgSpeed,
      totalHrs: totalHrs.toFixed(1),
      vlsfoCons: vlsfoCons > 0 ? vlsfoCons.toFixed(2) : "0.00",
      lsmgoCons: lsmgoCons > 0 ? lsmgoCons.toFixed(2) : "0.00",
      vlsfoPerDay,
      lsmgoPerDay,
      vlsfoProgress: depVlsfo
        ? Math.min((vlsfoCons / Number(depVlsfo)) * 100, 100)
        : 0,
      lsmgoProgress: depLsmgo
        ? Math.min((lsmgoCons / Number(depLsmgo)) * 100, 100)
        : 0,
      isVlsfoIncreased,
      isLsmgoIncreased,
    };
  }, [depDt, arrDt, noonReports, depVlsfo, arrVlsfo, depLsmgo, arrLsmgo]);

  // --- Handlers (UI) ---
  const handleAddRow = () => {
    if (removedNoonReports.length > 0) {
      const lastRemoved = removedNoonReports[removedNoonReports.length - 1];
      setNoonReports((prev) => [...prev, lastRemoved]);
      setRemovedNoonReports((prev) => prev.slice(0, -1));
    } else {
      setNoonReports((prev) => [
        ...prev,
        { noonDt: "", noonNm: "", noonHrs: 24, noonNote: "" },
      ]);
    }
  };

  const handleRemoveRow = () => {
    if (noonReports.length > 0) {
      const rowToRemove = noonReports[noonReports.length - 1];
      setRemovedNoonReports((prev) => [...prev, rowToRemove]);
      setNoonReports((prev) => prev.slice(0, -1));
    }
  };

  const updateNoonRow = (
    index: number,
    field: keyof NoonReportRow,
    value: any,
  ) => {
    const updatedRows = [...noonReports];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setNoonReports(updatedRows);
  };

  const handleClear = () => {
    setDepDt(""); setArrDt(""); setRfaDt(""); setPlannedNm("");
    setDepVlsfo(""); setArrVlsfo(""); setDepLsmgo(""); setArrLsmgo("");
    setNoonReports([{ noonDt: "", noonNm: "", noonHrs: 24, noonNote: "" }]);
    setRemovedNoonReports([]);
  };

  const vesselName = vesselsList.find((v) => v.value === vessel)?.label || "N/A";
  const voyageNo = voyagesList.find((v) => v.value === legId)?.label || "N/A";

  const pdfData = {
    vessel: vesselName,
    voyageNumber: voyageNo,
    departureTime: depDt || "N/A",
    arrivalTime: arrDt || "N/A",
    totalDistance: `${performance.totalDist} NM`,
    averageSpeed: `${performance.avgSpeed} knots`,
    totalSteamingTime: `${performance.totalHrs} hours`,
    legDuration: performance.durationStr,
    vlsfoConsumed: `${performance.vlsfoCons} MT`,
    vlsfoPerDay: `${performance.vlsfoPerDay} MT/Day`,
    lsmgoConsumed: `${performance.lsmgoCons} MT`,
    lsmgoPerDay: `${performance.lsmgoPerDay} MT/Day`,
  };

  return (
    <div className="space-y-4 pb-6 mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 dark:border-gray-800">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Voyage Analysis / Performance Report
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Auto-calculates performance by combining Departure, Daily Noon, and
            Arrival reports.
          </p>
        </div>
        <div>
          <DownloadPdfButton
            title="Voyage Analysis & Performance Report"
            filename={`Voyage_Report_${voyageNo}_${vesselName}`}
            data={pdfData}
            buttonLabel="Export PDF"
            disabled={!vessel || !legId}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Input Forms */}
        <div className="lg:col-span-8 space-y-3">
          {/* Leg Setup & Dates */}
          <ComponentCard title="Leg Setup & Timeline">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
              {/* --- Vessel & Voyage --- */}
              <div className="space-y-1">
                <Label>Vessel</Label>
                <SearchableSelect
                  options={vesselsList}
                  value={vessel}
                  onChange={handleVesselSelect} // ✅ Update URL
                  placeholder="Select Vessel..."
                />
              </div>

              <div className="space-y-1">
                <Label>Voyage ID</Label>
                <SearchableSelect
                  options={voyagesList}
                  value={legId}
                  onChange={handleVoyageSelect} // ✅ Update URL
                  placeholder={
                    !vessel
                      ? "Select Vessel First..."
                      : "Select Voyage..."
                  }
                  disabled={!vessel}
                />
              </div>

              {/* --- Dates & Times --- */}
              <div className="space-y-1">
                <Label>Departure Date & Time</Label>
                {isDataLoading ? <Skeleton height="h-11" /> : (
                  <Input
                    type="datetime-local"
                    value={depDt}
                    onChange={(e) => setDepDt(e.target.value)}
                    className="text-base h-11 w-full border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  />
                )}
              </div>

              <div className="space-y-1">
                <Label>Arrival Date & Time</Label>
                {isDataLoading ? <Skeleton height="h-11" /> : (
                  <Input
                    type="datetime-local"
                    value={arrDt}
                    onChange={(e) => setArrDt(e.target.value)}
                    className="text-base h-11 w-full border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  />
                )}
              </div>

              {/* --- VLSFO ROB --- */}
              <div className="space-y-1">
                <Label>Departure ROB — VLSFO (MT)</Label>
                {isDataLoading ? <Skeleton height="h-11" /> : (
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={depVlsfo}
                    onChange={(e) =>
                      setDepVlsfo(e.target.value ? Number(e.target.value) : "")
                    }
                    className="text-base h-11 w-full border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  />
                )}
              </div>

              <div className="space-y-1">
                <Label>Arrival ROB — VLSFO (MT)</Label>
                {isDataLoading ? <Skeleton height="h-11" /> : (
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={arrVlsfo}
                    onChange={(e) =>
                      setArrVlsfo(e.target.value ? Number(e.target.value) : "")
                    }
                    className="text-base h-11 w-full border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  />
                )}
              </div>

              {/* --- LSMGO ROB --- */}
              <div className="space-y-1">
                <Label>Departure ROB — LSMGO (MT)</Label>
                {isDataLoading ? <Skeleton height="h-11" /> : (
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={depLsmgo}
                    onChange={(e) =>
                      setDepLsmgo(e.target.value ? Number(e.target.value) : "")
                    }
                    className="text-base h-11 w-full border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  />
                )}
              </div>

              <div className="space-y-1">
                <Label>Arrival ROB — LSMGO (MT)</Label>
                {isDataLoading ? <Skeleton height="h-11" /> : (
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={arrLsmgo}
                    onChange={(e) =>
                      setArrLsmgo(e.target.value ? Number(e.target.value) : "")
                    }
                    className="text-base h-11 w-full border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  />
                )}
              </div>

              <div className="space-y-1">
                <Label>Distance to Next Port (NM)</Label>
                {isDataLoading ? <Skeleton height="h-11" /> : (
                  <Input
                    type="number"
                    placeholder="Planned/Reference"
                    value={plannedNm}
                    onChange={(e) =>
                      setPlannedNm(e.target.value ? Number(e.target.value) : "")
                    }
                    className="text-base h-11 w-full border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  />
                )}
              </div>

              <div className="space-y-1">
                <Label>RFA Start Date & Time (optional)</Label>
                {isDataLoading ? <Skeleton height="h-11" /> : (
                  <Input
                    type="datetime-local"
                    value={rfaDt}
                    onChange={(e) => setRfaDt(e.target.value)}
                    className="text-base h-11 w-full border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  />
                )}
              </div>
            </div>
          </ComponentCard>

          {/* Noon Reports Table */}
          <ComponentCard title="Daily Noon Reports">
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="h-8 px-3 text-xs font-bold text-slate-500 hover:text-green-600 dark:hover:text-green-600 dark:hover:bg-slate-700 rounded-lg transition-all"
              >
                <Plus size={14} className="me-1.5 stroke-[3]" />
                ADD DAY
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveRow}
                className="ms-2 h-8 px-3 text-xs font-bold text-slate-500 hover:text-red-500 dark:hover:text-red-600 dark:hover:bg-slate-700 rounded-lg transition-all"
              >
                <Minus size={14} className="me-1.5 stroke-[3]" />
                REMOVE LAST
              </Button>
            </div>

            {/* Added max-height and overflow-auto for vertical and horizontal scrolling */}
            <div className="overflow-auto max-h-[300px] border dark:border-gray-800 rounded-lg">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b dark:border-gray-800 bg-brand-500">
                    <th className="p-2 text-sm text-white ">
                      Noon Date & Time
                    </th>
                    <th className="p-2 text-sm text-white">
                      Actual Distance (NM)
                    </th>
                    <th className="p-2 text-sm text-white">
                      Steaming Time (hours)
                    </th>
                    <th className="p-2 text-sm text-white">Notes (optional)</th>
                  </tr>
                </thead>
                <tbody>
                  {isDataLoading
                    ? [...Array(3)].map((_, i) => (
                        <tr key={i} className="border-b dark:border-gray-800">
                          <td className="p-2">
                            <Skeleton height="h-6" />
                          </td>
                          <td className="p-2">
                            <Skeleton height="h-6" />
                          </td>
                          <td className="p-2">
                            <Skeleton height="h-6" />
                          </td>
                          <td className="p-2">
                            <Skeleton height="h-6" />
                          </td>
                        </tr>
                      ))
                    : noonReports.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
                        >
                          <td className="p-1.5">
                            <Input
                              type="datetime-local"
                              value={row.noonDt}
                              onChange={(e) =>
                                updateNoonRow(idx, "noonDt", e.target.value)
                              }
                              className="bg-transparent text-sm w-full focus:outline-none dark:text-white"
                            />
                          </td>
                          <td className="p-1.5">
                            <Input
                              type="number"
                              value={row.noonNm}
                              onChange={(e) =>
                                updateNoonRow(idx, "noonNm", e.target.value)
                              }
                              className="bg-transparent text-sm w-24 focus:outline-none dark:text-white"
                              placeholder="0.0"
                            />
                          </td>
                          <td className="p-1.5">
                            <Input
                              type="number"
                              value={row.noonHrs}
                              onChange={(e) =>
                                updateNoonRow(idx, "noonHrs", e.target.value)
                              }
                              className="bg-transparent text-sm w-24 focus:outline-none dark:text-white"
                              placeholder="24.0"
                            />
                          </td>
                          <td className="p-1.5">
                            <Input
                              value={row.noonNote}
                              onChange={(e) =>
                                updateNoonRow(
                                  idx,
                                  "noonNote",
                                  e.target.value.slice(0, 1000),
                                )
                              }
                              className="italic min-h-[40px] w-sm"
                              placeholder="Sea state, Wind, etc..."
                              maxLength={100}
                            />
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 leading-tight italic border-t mt-2 pt-2 dark:border-gray-700">
              Speed rule: 1 knot = 1 nautical mile per hour. So Avg Speed =
              Total NM / Total Hours.
            </p>
          </ComponentCard>
        </div>

        {/* RIGHT COLUMN: KPI SIDEBAR */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl p-4 sticky top-6">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-3">
              <div className="space-y-0">
                <h3 className="font-semibold text-2xl text-gray-800 dark:text-white flex items-center gap-2">
                  Performance Analytics
                </h3>
                <p className="text-base text-gray-500 font-medium tracking-tight">
                  Real-time Voyage KPIs
                </p>
              </div>
              <Badge
                color={performance.totalDist === "0.0" ? "warning" : "success"}
              >
                {performance.totalDist === "0.0" ? "Pending" : "Ready"}
              </Badge>
            </div>

            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                {
                  label: "LEG TIME",
                  value: performance.durationStr,
                  unit: null,
                  icon: Timer,
                  tooltip: "Arrival Date/Time - Departure Date/Time",
                  width: "w-24",
                },
                {
                  label: "DISTANCE",
                  value: performance.totalDist,
                  unit: "NM",
                  icon: Navigation,
                  tooltip:
                    "Sum of nautical miles recorded between departure and arrival",
                  width: "w-20",
                },
              ].map((metric, idx) => (
                <div
                  key={idx}
                  className="group relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all"
                >
                  {/* Subtle Background Accent */}
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 h-16 w-16 rounded-full bg-teal-50 dark:bg-teal-900/20 blur-2xl transition-colors" />

                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-900/30">
                      <metric.icon
                        className="text-teal-600 dark:text-teal-400"
                        size={20}
                      />
                    </div>
                    <Tooltip content={metric.tooltip} position="left">
                      <button className="text-slate-400 transition-colors">
                        <Info size={14} />
                      </button>
                    </Tooltip>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                      {metric.label}
                    </p>
                    <div className="flex items-baseline gap-1">
                      {isDataLoading ? (
                        <Skeleton height="h-8" width={metric.width} />
                      ) : (
                        <>
                          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                            {metric.value}
                          </span>
                          {metric.unit && (
                            <span className="text-xs font-medium text-slate-400 uppercase">
                              {metric.unit}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Secondary Detail List */}
            <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-800/50">
              {[
                {
                  label: "Avg Speed",
                  value: performance.avgSpeed,
                  unit: "kts",
                  subtext: "Total Dist / Steam Hrs",
                  icon: Activity,
                  color: "text-orange-500",
                  tooltip: "Total Distance (NM) / Total Steam Hours",
                },
                {
                  label: "Steam Time",
                  value: performance.totalHrs,
                  unit: "hrs",
                  subtext: "Recorded at Sea",
                  icon: Anchor,
                  color: "text-indigo-500",
                  tooltip:
                    "Total cumulative hours recorded while the vessel is 'At Sea'",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="group flex items-center justify-between py-4 px-2"
                >
                  <div className="flex items-center gap-3">
                    {/* Simple Icon - No Box */}
                    <item.icon
                      className={`${item.color} opacity-80 group-hover:opacity-100 transition-opacity`}
                      size={20}
                    />

                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                          {item.label}
                        </span>
                        <Tooltip content={item.tooltip}>
                          <Info
                            size={12}
                            className="text-gray-400 hover:text-gray-500 cursor-help transition-colors"
                          />
                        </Tooltip>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium">
                        {item.subtext}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {isDataLoading ? (
                      <Skeleton height="h-6" width="w-16" />
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                          {item.value}{" "}
                          <span className="text-xs font-normal text-gray-400 ml-0.5">
                            {item.unit}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Fuel Consumption Section */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 px-1 text-slate-400 dark:text-slate-500">
                <Fuel />
                <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">
                  Fuel Consumption
                </h4>
                <div className="h-[1px] flex-grow bg-slate-100 dark:bg-slate-800" />
              </div>

              {[
                {
                  type: "VLSFO",
                  consumed: performance.vlsfoCons,
                  perDay: performance.vlsfoPerDay,
                  progress: performance.vlsfoProgress,
                  isIncreased: performance.isVlsfoIncreased,
                  dep: depVlsfo,
                  arr: arrVlsfo,
                  theme: "purple",
                  accentColor: "text-purple-600 dark:text-purple-400",
                  bgColor: "bg-purple-500",
                  badgeColor:
                    "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
                },
                {
                  type: "LSMGO",
                  consumed: performance.lsmgoCons,
                  perDay: performance.lsmgoPerDay,
                  progress: performance.lsmgoProgress,
                  isIncreased: performance.isLsmgoIncreased,
                  dep: depLsmgo,
                  arr: arrLsmgo,
                  theme: "emerald",
                  accentColor: "text-emerald-600 dark:text-emerald-400",
                  bgColor: "bg-emerald-500",
                  badgeColor:
                    "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
                },
              ].map((fuel, idx) => (
                <div
                  key={idx}
                  className={`group relative rounded-2xl border transition-all duration-300 ${
                    fuel.isIncreased
                      ? "border-orange-200 bg-orange-50/20 dark:border-orange-900/50 dark:bg-orange-900/5 shadow-sm"
                      : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50"
                  }`}
                >
                  {isDataLoading ? (
                    <div className="p-4">
                      <Skeleton height="h-24" />
                    </div>
                  ) : (
                    <div className="p-4">
                      {/* Header Row */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold tracking-widest text-slate-900 dark:text-white uppercase">
                              {fuel.type}
                            </span>
                            {fuel.isIncreased && (
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 animate-pulse">
                                <AlertTriangle size={12} strokeWidth={3} />
                                <span className="text-[10px] font-bold uppercase">
                                  Bunkered / Increased
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <span className="text-xs font-medium">
                              Total Consumed
                            </span>
                            <Tooltip
                              content="(Departure ROB - Arrival ROB) + Any Bunkering"
                              position="right"
                            >
                              <Info
                                size={11}
                                className="cursor-help opacity-60 hover:opacity-100"
                              />
                            </Tooltip>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex flex-col items-end">
                            <div
                              className={`text-2xl font-black tabular-nums ${fuel.accentColor}`}
                            >
                              {fuel.consumed}
                              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ms-1">
                                MT
                              </span>
                            </div>
                            <div
                              className={`mt-1 flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[12px] ${fuel.badgeColor}`}
                            >
                              {fuel.perDay} MT / DAY
                              <Tooltip
                                content="Total MT Consumed / (Total Steam Hours / 24)"
                                position="left"
                              >
                                <Info size={10} className="cursor-help" />
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Section */}
                      <div className="space-y-2">
                        <div className="relative h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              fuel.isIncreased ? "bg-orange-400" : fuel.bgColor
                            }`}
                            style={{ width: `${fuel.progress}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center px-0.5">
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-tighter">
                              Departure
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                              {fuel.dep || 0}{" "}
                              <span className="text-[10px] font-normal opacity-70">
                                MT
                              </span>
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-tighter">
                              Arrival
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                              {fuel.arr || 0}{" "}
                              <span className="text-[10px] font-normal opacity-70">
                                MT
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Validation Note Footer */}
            <div className="mt-4 border-t border-dashed border-gray-200 dark:border-gray-800">
              <p className="mt-2 text-xs text-gray-400 leading-relaxed italic">
                Values derived from ROB differences. Noon reports are used for
                distance and speed only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

/**
 * Skeleton Loader Component
 */
function Skeleton({
  height = "h-4",
  width = "w-full",
}: {
  height?: string;
  width?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${height} ${width}`}
    />
  );
}