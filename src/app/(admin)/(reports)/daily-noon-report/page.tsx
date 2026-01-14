"use client";

import ComponentCard from "@/components/common/ComponentCard";
import ExportToExcel from "@/components/common/ExportToExcel";
import Filters from "@/components/common/Filters";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { useEffect, useState } from "react";
import AddDailyNoonReportButton from "./AddDailyNoonReportButton";
import DailyNoonReportTable from "./DailyNoonReportTable";
import TableCount from "@/components/common/TableCount";
import { useAuthorization } from "@/hooks/useAuthorization"; // ✅ Added

export default function DailyNoonReport() {
  const [refresh, setRefresh] = useState(0);
  const [reportsData, setReportsData] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState("all");

  
  // ✅ Authorization logic
  const { can, isReady, user } = useAuthorization();
  const isSuperAdmin = user?.role?.toLowerCase() === "super-admin";
  const canView = can("noon.view");
  const canCreate = can("noon.create");

  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("noon");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [vesselId, setVesselId] = useState("");
  const [voyageId, setVoyageId] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [companies, setCompanies] = useState<any[]>([]);
  const [vessels, setVessels] = useState<any[]>([]);
  const [allVoyages, setAllVoyages] = useState<any[]>([]);
  
  const handleRefresh = () => setRefresh((prev) => prev + 1);

  const excelMapping = (r: any) => ({
    "Vessel Name": typeof r.vesselId === "object" ? r.vesselId.name : r.vesselName,
    "Voyage No": typeof r.voyageId === "object" ? r.voyageId.voyageNo : r.voyageNo,
    "Report Date": new Date(r.reportDate).toLocaleString(),
    Status: r.status,
    Latitude: r.position?.lat || "-",
    Longitude: r.position?.long || "-",
    "Dist Last 24h": r.navigation?.distLast24h || 0,
    "Engine Dist": r.navigation?.engineDist || 0,
    "Slip %": r.navigation?.slip || 0,
    "Next Port": r.navigation?.nextPort || "-",
    "VLSFO Consumed": r.consumption?.vlsfo || 0,
    "LSMGO Consumed": r.consumption?.lsmgo || 0,
    Wind: r.weather?.wind || "-",
    "Sea State": r.weather?.seaState || "-",
    Remarks: r.remarks || "-",
  });

  // 1. Wait for Auth load
  if (!isReady) return null;

  // 2. Gate the entire page
  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">You do not have permission to access Daily Noon Reports.</p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Daily Noon Report
        </h2>
        <div className="flex items-center gap-3">
          <FilterToggleButton
            isVisible={isFilterVisible}
            onToggle={setIsFilterVisible}
          />
          <ExportToExcel
            data={reportsData}
            fileName="Daily_Noon_Reports"
            exportMap={excelMapping}
          />
          {/* ✅ Check permission for creating noon reports */}
          {canCreate && <AddDailyNoonReportButton onSuccess={handleRefresh} vesselList={vessels} allVoyages={allVoyages}/>}
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
              companies={isSuperAdmin ? companies : []}
              companyId={companyId}
              setCompanyId={setCompanyId}
            />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="Reports" />
        </div>
        <DailyNoonReportTable
          refresh={refresh}
          search={search}
          status={status}
          startDate={startDate}
          endDate={endDate}
          onDataLoad={setReportsData}
          setTotalCount={setTotalCount} 
          vesselId={vesselId}
          voyageId={voyageId}
          vesselList={vessels}
          companyId={companyId}
          onFilterDataLoad={(filterData) => {
            // 🟢 This correctly populates your filters from the Single API call
            setVessels(filterData.vessels);
            setCompanies(filterData.companies);
            setAllVoyages(filterData.voyages);
          }}
        />
      </ComponentCard>
    </div>
  );
}