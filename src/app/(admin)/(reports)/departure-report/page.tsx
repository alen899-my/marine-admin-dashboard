"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Filters from "@/components/common/Filters";
import { useState } from "react";
import AddDepartureReportButton from "./AddDepartureReportButton";
import DepartureReportTable from "./DepartureReportTable";
import ExportToExcel from "@/components/common/ExportToExcel";

export default function DepartureReport() {
  const [refresh, setRefresh] = useState(0);
  const [reportsData, setReportsData] = useState<any[]>([]); // Data for Excel

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleRefresh = () => setRefresh((prev) => prev + 1);

  // Define Departure Report Excel Columns
  const excelMapping = (r: any) => ({
    "Vessel Name": typeof r.vesselId === "object" ? r.vesselId.name : r.vesselName,
    "Voyage ID": typeof r.voyageId === "object" ? r.voyageId.voyageNo : r.voyageNo,
    "Current Port": r.portName || "-",
    "Last Port": r.lastPort || "-",
    "Departure Time": r.eventTime ? new Date(r.eventTime).toLocaleString("en-IN") : "-",
    "Report Date": r.reportDate ? new Date(r.reportDate).toLocaleString("en-IN") : "-",
    "Dist to Next Port (NM)": r.navigation?.distanceToNextPortNm || 0,
    "ETA Next Port": r.navigation?.etaNextPort ? new Date(r.navigation.etaNextPort).toLocaleString("en-IN") : "-",
    "ROB VLSFO (MT)": r.departureStats?.robVlsfo || 0,
    "ROB LSMGO (MT)": r.departureStats?.robLsmgo || 0,
    "Bunkers Recv VLSFO": r.departureStats?.bunkersReceivedVlsfo || 0,
    "Bunkers Recv LSMGO": r.departureStats?.bunkersReceivedLsmgo || 0,
    "Cargo Loaded (MT)": r.departureStats?.cargoQtyLoadedMt || 0,
    "Cargo Unloaded (MT)": r.departureStats?.cargoQtyUnloadedMt || 0,
    "Cargo Summary": r.departureStats?.cargoSummary || "-",
    "Status": r.status === "active" ? "Active" : "Inactive",
    "Remarks": r.remarks || "",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Departure Report
        </h2>

        <div className="flex items-center gap-2">
          {/* Export Button integrated next to Add button */}
          <ExportToExcel 
            data={reportsData} 
            fileName="Departure_Reports" 
            exportMap={excelMapping} 
          />
          <AddDepartureReportButton onSuccess={handleRefresh} />
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
        <DepartureReportTable
          refresh={refresh}
          search={search}
          status={status}
          startDate={startDate}
          endDate={endDate}
          onDataLoad={setReportsData} // Capture the table data here
        />
      </ComponentCard>
    </div>
  );
}