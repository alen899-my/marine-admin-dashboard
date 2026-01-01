"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Filters from "@/components/common/Filters";
import { useState } from "react";
import AddDailyNoonReportButton from "./AddDailyNoonReportButton";
import DailyNoonReportTable from "./DailyNoonReportTable";
import ExportToExcel from "@/components/common/ExportToExcel"; // Import the new component

export default function DailyNoonReport() {
  const [refresh, setRefresh] = useState(0);
  const [reportsData, setReportsData] = useState<any[]>([]); // Hold data for export

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleRefresh = () => setRefresh((prev) => prev + 1);

  // Formatting logic for Excel (flattening nested objects)
  const excelMapping = (r: any) => ({
    "Vessel Name": typeof r.vesselId === 'object' ? r.vesselId.name : r.vesselName,
    "Voyage No": typeof r.voyageId === 'object' ? r.voyageId.voyageNo : r.voyageNo,
    "Report Date": new Date(r.reportDate).toLocaleString(),
    "Status": r.status,
    "Latitude": r.position?.lat || "-",
    "Longitude": r.position?.long || "-",
    "Dist Last 24h": r.navigation?.distLast24h || 0,
    "Engine Dist": r.navigation?.engineDist || 0,
    "Slip %": r.navigation?.slip || 0,
    "Next Port": r.navigation?.nextPort || "-",
    "VLSFO Consumed": r.consumption?.vlsfo || 0,
    "LSMGO Consumed": r.consumption?.lsmgo || 0,
    "Wind": r.weather?.wind || "-",
    "Sea State": r.weather?.seaState || "-",
    "Remarks": r.remarks || "-"
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Daily Noon Report
        </h2>

        <div className="flex items-center gap-2">
          {/* New Export Button */}
          <ExportToExcel 
            data={reportsData} 
            fileName="Daily_Noon_Reports" 
            exportMap={excelMapping} 
          />
          <AddDailyNoonReportButton onSuccess={handleRefresh} />
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          <Filters
            search={search} setSearch={setSearch}
            status={status} setStatus={setStatus}
            startDate={startDate} setStartDate={setStartDate}
            endDate={endDate} setEndDate={setEndDate}
          />
        }
      >
        <DailyNoonReportTable 
          refresh={refresh} 
          search={search}
          status={status}
          startDate={startDate}
          endDate={endDate}
          onDataLoad={setReportsData} // Capture the data here
        />
      </ComponentCard>
    </div>
  );
}