"use client";

import ComponentCard from "@/components/common/ComponentCard";
import ExportToExcel from "@/components/common/ExportToExcel";
import Filters from "@/components/common/Filters";
import FilterToggleButton from "@/components/common/FilterToggleButton"; // Shared Component
import { useFilterPersistence } from "@/hooks/useFilterPersistence"; // Shared Hook
import { useEffect, useState } from "react";
import AddDepartureReportButton from "./AddDepartureReportButton";
import DepartureReportTable from "./DepartureReportTable";
import TableCount from "@/components/common/TableCount";
import { useAuthorization } from "@/hooks/useAuthorization"; // ✅ Added

export default function DepartureReport() {
  const [refresh, setRefresh] = useState(0);
  const [reportsData, setReportsData] = useState<any[]>([]); // Data for Excel
  const [totalCount, setTotalCount] = useState(0);

  // ✅ Authorization logic
  const { can, isReady } = useAuthorization();
  const canView = can("departure.view");
  const canCreate = can("departure.create");

  // Use the shared persistent filter logic
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("departure");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [vesselId, setVesselId] = useState("");
  const [voyageId, setVoyageId] = useState("");
  const [vessels, setVessels] = useState([]);

  useEffect(() => {
    async function fetchVessels() {
      // Only fetch if user is authorized to view
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

  // Define Departure Report Excel Columns
  const excelMapping = (r: any) => ({
    "Vessel Name":
      typeof r.vesselId === "object" ? r.vesselId.name : r.vesselName,
    "Voyage ID":
      typeof r.voyageId === "object" ? r.voyageId.voyageNo : r.voyageNo,
    "Current Port": r.portName || "-",
    "Last Port": r.lastPort || "-",
    "Departure Time": r.eventTime
      ? new Date(r.eventTime).toLocaleString("en-IN")
      : "-",
    "Report Date": r.reportDate
      ? new Date(r.reportDate).toLocaleString("en-IN")
      : "-",
    "Dist to Next Port (NM)": r.navigation?.distanceToNextPortNm || 0,
    "ETA Next Port": r.navigation?.etaNextPort
      ? new Date(r.navigation.etaNextPort).toLocaleString("en-IN")
      : "-",
    "ROB VLSFO (MT)": r.departureStats?.robVlsfo || 0,
    "ROB LSMGO (MT)": r.departureStats?.robLsmgo || 0,
    "Bunkers Recv VLSFO": r.departureStats?.bunkersReceivedVlsfo || 0,
    "Bunkers Recv LSMGO": r.departureStats?.bunkersReceivedLsmgo || 0,
    "Cargo Loaded (MT)": r.departureStats?.cargoQtyLoadedMt || 0,
    "Cargo Unloaded (MT)": r.departureStats?.cargoQtyUnloadedMt || 0,
    "Cargo Summary": r.departureStats?.cargoSummary || "-",
    Status: r.status === "active" ? "Active" : "Inactive",
    Remarks: r.remarks || "",
  });

  // 1. Wait for Auth load
  if (!isReady) return null;

  // 2. Gate the entire page
  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">You do not have permission to access Departure Reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Departure Report
        </h2>

        <div className="flex items-center gap-3">
          {/* Use the shared UI toggle */}
          <FilterToggleButton
            isVisible={isFilterVisible}
            onToggle={setIsFilterVisible}
          />
          {/* Export Button integrated next to Add button */}
          <ExportToExcel
            data={reportsData}
            fileName="Departure_Reports"
            exportMap={excelMapping}
          />
          {/* ✅ Check permission for adding departure reports */}
          {canCreate && <AddDepartureReportButton  vesselList={vessels} onSuccess={handleRefresh} />}
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
        <DepartureReportTable
          refresh={refresh}
          search={search}
          status={status}
          startDate={startDate}
          endDate={endDate}
          onDataLoad={setReportsData} // Capture the table data here
          setTotalCount={setTotalCount}
          vesselId={vesselId}
          voyageId={voyageId}
          vesselList={vessels}
        />
      </ComponentCard>
    </div>
  );
}