"use client";

import ComponentCard from "@/components/common/ComponentCard";
import ExportToExcel from "@/components/common/ExportToExcel";
import Filters from "@/components/common/Filters";
import FilterToggleButton from "@/components/common/FilterToggleButton"; // Shared Component
import TableCount from "@/components/common/TableCount";
import { useFilterPersistence } from "@/hooks/useFilterPersistence"; // Shared Hook
import { useEffect, useState } from "react";
import AddArrivalReportButton from "./AddArrivalReportButton";
import ArrivalReportTable from "./ArrivalReportTable";
import { useAuthorization } from "@/hooks/useAuthorization"; // ✅ Added

export default function ArrivalReport() {
  const [refresh, setRefresh] = useState(0);
  const [reportsData, setReportsData] = useState<any[]>([]); // State for Excel data
  const [totalCount, setTotalCount] = useState(0);

  // ✅ Authorization logic
  const { can, isReady } = useAuthorization();
  const canView = can("arrival.view");
  const canCreate = can("arrival.create");

  // Use the shared persistent filter logic
  const { isFilterVisible, setIsFilterVisible } =
    useFilterPersistence("arrival");

  // --- Moved State from Table to Page ---
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [vesselId, setVesselId] = useState("");
  const [voyageId, setVoyageId] = useState("");
  const [vessels, setVessels] = useState([]);

  useEffect(() => {
    async function fetchVessels() {
      // Only fetch if user has view permission
      if (!canView) return;

      try {
        const res = await fetch("/api/vessels");
        if (res.ok) {
          const result = await res.json();
          setVessels(Array.isArray(result) ? result : result.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch vessels", error);
      }
    }
    if (isReady) fetchVessels();
  }, [isReady, canView]);

  const handleRefresh = () => setRefresh((prev) => prev + 1);

  // Define how Arrival Data maps to Excel Columns
  const excelMapping = (r: any) => ({
    "Vessel Name":
      typeof r.vesselId === "object" ? r.vesselId?.name : r.vesselName,
    "Voyage ID":
      typeof r.voyageId === "object" ? r.voyageId?.voyageNo : r.voyageNo,
    "Port Name": r.portName || "-",
    "Arrival Time": r.eventTime
      ? new Date(r.eventTime).toLocaleString("en-IN")
      : "-",
    "NOR Tendered": r.norDetails?.norTime
      ? new Date(r.norDetails.norTime).toLocaleString("en-IN")
      : "-",
    "Report Date": r.reportDate
      ? new Date(r.reportDate).toLocaleString("en-IN")
      : "-",
    "Arrival Cargo (MT)": r.arrivalStats?.arrivalCargoQtyMt || 0,
    "ROB VLSFO (MT)": r.arrivalStats?.robVlsfo || 0,
    "ROB LSMGO (MT)": r.arrivalStats?.robLsmgo || 0,
    "Steaming Time (Hrs)": r.metrics?.totalTimeHours ?? "N/A",
    "Total Distance (NM)": r.metrics?.totalDistance ?? "N/A",
    "Avg Speed (Kts)": r.metrics?.avgSpeed ?? "N/A",
    "VLSFO Consumed (MT)": r.metrics?.consumedVlsfo ?? "N/A",
    "LSMGO Consumed (MT)": r.metrics?.consumedLsmgo ?? "N/A",
    Status: r.status === "active" ? "Active" : "Inactive",
    Remarks: r.remarks || "No Remarks",
  });

  // 1. Wait for Auth load
  if (!isReady) return null;

  // 2. Gate the entire page
  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">You do not have permission to access Arrival Reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Arrival Report
        </h2>

        <div className="flex items-center gap-3">
          {/* Shared Filter Toggle */}
          <FilterToggleButton
            isVisible={isFilterVisible}
            onToggle={setIsFilterVisible}
          />
          {/* Reusable Export Button */}
          <ExportToExcel
            data={reportsData}
            fileName="Arrival_Reports"
            exportMap={excelMapping}
          />
          {/* ✅ Check permission for creating arrival reports */}
          {canCreate && <AddArrivalReportButton onSuccess={handleRefresh} />}
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          isFilterVisible ? (
            <Filters
              search={search}
              setSearch={setSearch}
              status={status}
              setStatus={setStatus}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              vesselId={vesselId}
              setVesselId={setVesselId}
              voyageId={voyageId}
              setVoyageId={setVoyageId}
              vessels={vessels}
            />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="Reports" />
        </div>
        <ArrivalReportTable
          refresh={refresh}
          search={search}
          status={status}
          startDate={startDate}
          endDate={endDate}
          onDataLoad={setReportsData} // Capture data from table
          setTotalCount={setTotalCount}
          vesselId={vesselId}
          voyageId={voyageId}
          vesselList={vessels}
        />
      </ComponentCard>
    </div>
  );
}