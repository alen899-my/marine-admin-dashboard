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
  const { can, isReady, user } = useAuthorization();
  const isSuperAdmin = user?.role?.toLowerCase() === "super-admin";

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
  const [companyId, setCompanyId] = useState("all");
 const [companies, setCompanies] = useState<any[]>([]); 
const [vessels, setVessels] = useState<any[]>([]);   
const [voyages, setVoyages] = useState<any[]>([]);    

 

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
<div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
  {/* Desktop: First (Left) | Mobile: Bottom */}
  <div className="w-full flex justify-end sm:w-auto">
    <FilterToggleButton 
      isVisible={isFilterVisible} 
      onToggle={setIsFilterVisible} 
    />
  </div>

  {/* Desktop: Middle | Mobile: Middle */}
  <div className="w-full sm:w-auto">
    <ExportToExcel 
      data={reportsData} 
      fileName="Cargo_Documents_Report" 
      exportMap={excelMapping}
      className="w-full justify-center"
    />
  </div>

  {/* Desktop: Last (Right) | Mobile: Top */}
  {canCreate && (
    <div className="w-full sm:w-auto">
      <AddCargoButton 
        onSuccess={handleRefresh} 
        vesselList={vessels} 
        allVoyages={voyages}
        className="w-full justify-center"
      />
    </div>
  )}
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
              isSuperAdmin={isSuperAdmin}
              companies={companies}
              companyId={companyId}
              setCompanyId={setCompanyId}
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
          companyId={companyId}
          vesselList={vessels}
          onFilterDataLoad={(data) => {
    setVessels(data.vessels);
    setCompanies(data.companies);
    setVoyages(data.voyages);
  }}
        />
      </ComponentCard>
    </div>
  );
}