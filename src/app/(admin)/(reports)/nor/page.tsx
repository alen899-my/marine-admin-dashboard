"use client";

import ComponentCard from "@/components/common/ComponentCard";
import ExportToExcel from "@/components/common/ExportToExcel"; // Import common component
import Filters from "@/components/common/Filters";
import FilterToggleButton from "@/components/common/FilterToggleButton"; // Shared Component
import TableCount from "@/components/common/TableCount";
import { useFilterPersistence } from "@/hooks/useFilterPersistence"; // Shared Hook
import { useEffect, useState } from "react";
import AddNORButton from "./AddNORButton";
import NorReportTable from "./NorReportTable";
import { useAuthorization } from "@/hooks/useAuthorization"; // ✅ Added

export default function NoticeOfReadiness() {
  const [refresh, setRefresh] = useState(0);
  const [reportsData, setReportsData] = useState<any[]>([]); // State for export data
  const [totalCount, setTotalCount] = useState(0);

  // ✅ Authorization logic
  const { can, isReady } = useAuthorization();
  const canView = can("nor.view");
  const canCreate = can("nor.create");

  // Use the shared persistent filter logic
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("nor");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [vesselId, setVesselId] = useState("");
  const [voyageId, setVoyageId] = useState("");
  const [vessels, setVessels] = useState([]);

  useEffect(() => {
    async function fetchVessels() {
      // Only fetch vessels if the user is authorized to view the page
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

  // Define how NOR Data maps to Excel Columns
  const excelMapping = (r: any) => ({
    "Vessel Name":
      typeof r.vesselId === "object" ? r.vesselId?.name : r.vesselName,
    "Voyage No":
      typeof r.voyageId === "object" ? r.voyageId?.voyageNo : r.voyageNo,
    "Port Name": r.portName || "-",
    "NOR Tendered Time": r.norDetails?.tenderTime
      ? new Date(r.norDetails.tenderTime).toLocaleString("en-IN")
      : "-",
    "ETA Port": r.norDetails?.etaPort
      ? new Date(r.norDetails.etaPort).toLocaleString("en-IN")
      : "-",
    "Pilot Station": r.norDetails?.pilotStation || "N/A",
    "Report Date": r.reportDate
      ? new Date(r.reportDate).toLocaleString("en-IN")
      : "-",
    Status: r.status === "active" ? "Active" : "Inactive",
    Remarks: r.remarks || "No Remarks",
    "Document URL": r.norDetails?.documentUrl || "No Attachment",
  });

  // 1. Wait for Auth check
  if (!isReady) return null;

  // 2. Full Page Guard
  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">You do not have permission to access NOR Reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          NOR (Notice of Readiness)
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
            fileName="NOR_Reports"
            exportMap={excelMapping}
          />
          {/* ✅ Check permission for creating NOR */}
          {canCreate && <AddNORButton onSuccess={handleRefresh} />}
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
        <NorReportTable
          refresh={refresh}
          search={search}
          status={status}
          startDate={startDate}
          endDate={endDate}
          onDataLoad={setReportsData} // Capture data from the table
          setTotalCount={setTotalCount}
          vesselId={vesselId}
          voyageId={voyageId}
          vesselList={vessels}
        />
      </ComponentCard>
    </div>
  );
}