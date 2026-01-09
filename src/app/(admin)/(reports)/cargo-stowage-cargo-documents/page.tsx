"use client";

import ComponentCard from "@/components/common/ComponentCard";
import CargoReportTable from "./CargoReportTable";
import Filters from "@/components/common/Filters";
import { useState, useEffect } from "react";
import AddCargoButton from "./AddCragoButton";
import ExportToExcel from "@/components/common/ExportToExcel";
import FilterToggleButton from "@/components/common/FilterToggleButton"; // Shared Component
import { useFilterPersistence } from "@/hooks/useFilterPersistence"; // Shared Hook
import TableCount from "@/components/common/TableCount";
import { useAuthorization } from "@/hooks/useAuthorization"; // ✅ Added

export default function CragoStowageCargoDocuments() {
  const [refresh, setRefresh] = useState(0);
  const [reportsData, setReportsData] = useState<any[]>([]); // Data for Excel
  const [totalCount, setTotalCount] = useState(0);

  // ✅ Authorization logic
  const { can, isReady } = useAuthorization();
  const canView = can("cargo.view");
  const canCreate = can("cargo.create");

  // Use the shared persistent filter logic
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("cargoDocuments");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [vesselId, setVesselId] = useState("");
  const [voyageId, setVoyageId] = useState("");
  const [vessels, setVessels] = useState([]);

  useEffect(() => {
    async function fetchVessels() {
      // Only fetch vessels if user is authorized to view
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

  // Define how Cargo Document Data maps to Excel Columns
  const excelMapping = (r: any) => ({
    "Vessel Name": typeof r.vesselId === "object" ? r.vesselId?.name : r.vesselName,
    "Voyage ID": typeof r.voyageId === "object" ? r.voyageId?.voyageNo : r.voyageNo,
    "Port Name": r.portName || "-",
    "Port Type": (r.portType?.replace("_", " ") || "-") + " Port",
    "Document Type": r.documentType?.replace(/_/g, " ").toUpperCase() || "-",
    "Document Date": r.documentDate ? new Date(r.documentDate).toLocaleDateString("en-IN") : "-",
    "Report Date": r.reportDate ? new Date(r.reportDate).toLocaleString("en-IN") : "-",
    "Status": r.status === "active" ? "Active" : "Inactive",
    "File URL": r.file?.url || "No Attachment",
    "Remarks": r.remarks || "No Remarks",
  });

  // 1. Wait for Auth check
  if (!isReady) return null;

  // 2. Full Page Guard
  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">You do not have permission to access Cargo Documents.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section: Title on left, Buttons on right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Cargo Stowage & Cargo Documents
        </h2>
  
        <div className="flex items-center gap-3">
          {/* Shared Filter Toggle */}
          <FilterToggleButton 
            isVisible={isFilterVisible} 
            onToggle={setIsFilterVisible} 
          />
          {/* New Export Button */}
          <ExportToExcel 
            data={reportsData} 
            fileName="Cargo_Documents_Report" 
            exportMap={excelMapping}
           />
          {/* ✅ Check permission for creating cargo documents */}
          {canCreate && <AddCargoButton onSuccess={handleRefresh} />}
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
        <CargoReportTable
          refresh={refresh}
          search={search}
          status={status}
          startDate={startDate}
          endDate={endDate}
          onDataLoad={setReportsData} // Capture data here
          setTotalCount={setTotalCount}
          vesselId={vesselId}
          voyageId={voyageId}
          vesselList={vessels}
        />
      </ComponentCard>
    </div>
  );
}