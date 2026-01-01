"use client";

import ComponentCard from "@/components/common/ComponentCard";
import CargoReportTable from "./CargoReportTable";
import Filters from "@/components/common/Filters";
import { useState } from "react";
import AddCargoButton from "./AddCragoButton";
import ExportToExcel from "@/components/common/ExportToExcel";

export default function CragoStowageCargoDocuments() {
  const [refresh, setRefresh] = useState(0);
  const [reportsData, setReportsData] = useState<any[]>([]); // Data for Excel

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Cargo Stowage & Cargo Documents
        </h2>

        <div className="flex items-center gap-2">
          {/* New Export Button */}
          <ExportToExcel 
            data={reportsData} 
            fileName="Cargo_Documents_Report" 
            exportMap={excelMapping} 
          />
          <AddCargoButton onSuccess={handleRefresh} />
        </div>
      </div>
      
      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          <Filters
            search={search}
            setSearch={setSearch}
            status={status}
            setStatus={setStatus}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
          />
        }
      >
        <CargoReportTable
          refresh={refresh}
          search={search}
          status={status}
          startDate={startDate}
          endDate={endDate}
          onDataLoad={setReportsData} // Capture data here
        />
      </ComponentCard>
    </div>
  );
}