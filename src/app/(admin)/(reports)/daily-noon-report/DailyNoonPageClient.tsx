"use client";

import ComponentCard from "@/components/common/ComponentCard";
import ExportToExcel from "@/components/common/ExportToExcel";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { ReactNode, useEffect, useState } from "react";
import AddDailyNoonReportButton from "./AddDailyNoonReportButton";
import DailyNoonFilterWrapper from "./DailyNoonFilterWrapper";

// Excel Mapping (Client Side)
const excelMapping = (r: any) => ({
  "Vessel Name":
    typeof r.vesselId === "object" && r.vesselId !== null
      ? r.vesselId.name
      : r.vesselName || "-",
  "Voyage No":
    typeof r.voyageId === "object" && r.voyageId !== null
      ? r.voyageId.voyageNo
      : r.voyageNo || "-",
  "Report Date": r.reportDate ? new Date(r.reportDate).toLocaleString() : "-",
  Status: r.status || "-",
  Latitude: r.position?.lat || "-",
  Longitude: r.position?.long || "-",
  "Dist Last 24h": r.navigation?.distLast24h ?? 0,
  "Engine Dist": r.navigation?.engineDist ?? 0,
  "Slip %": r.navigation?.slip ?? 0,
  "Next Port": r.navigation?.nextPort || "-",
  "VLSFO Consumed": r.consumption?.vlsfo ?? 0,
  "LSMGO Consumed": r.consumption?.lsmgo ?? 0,
  Wind: r.weather?.wind || "-",
  "Sea State": r.weather?.seaState || "-",
  Remarks: r.remarks || "-",
});

interface DailyNoonPageClientProps {
  children: ReactNode;
  data: any[];
  totalCount: number;
  filterOptions: {
    vessels: any[];
    companies: any[];
    voyages: any[];
  };
  isSuperAdmin: boolean;
}

export default function DailyNoonReportClient({
  children,
  data,
  totalCount,
  filterOptions,
  isSuperAdmin,
}: DailyNoonPageClientProps) {
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("noon");

  //  FIX: Add mounted state to prevent Hydration Mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine effective visibility:
  // On Server & First Render -> Always False (matches server)
  // After Mount -> Use the value from LocalStorage
  const effectiveFilterVisibility = mounted ? isFilterVisible : false;

  return (
    <div className="space-y-6">
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Daily Noon Report
        </h2>

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* 1. Filter Toggle Button */}
          <div className="w-full flex justify-end sm:w-auto">
            <FilterToggleButton
              isVisible={effectiveFilterVisibility} //  Use safe variable
              onToggle={setIsFilterVisible}
            />
          </div>

          {/* 2. Export Button */}
          <div className="w-full sm:w-auto">
            <ExportToExcel
              data={data}
              fileName="Daily_Noon_Reports"
              exportMap={excelMapping}
              className="w-full justify-center"
            />
          </div>

          {/* 3. Add Button */}
          <div className="w-full sm:w-auto">
            <AddDailyNoonReportButton
              vesselList={filterOptions.vessels}
              allVoyages={filterOptions.voyages}
              className="w-full justify-center"
            />
          </div>
        </div>
      </div>

      {/* --- CARD SECTION --- */}
      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          //  Conditional Rendering based on safe variable
          effectiveFilterVisibility ? (
            <DailyNoonFilterWrapper
              vessels={filterOptions.vessels}
              companies={filterOptions.companies}
              isSuperAdmin={isSuperAdmin}
            />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="Reports" />
        </div>

        {/* The Server Table (Passed as Child) */}
        {children}
      </ComponentCard>
    </div>
  );
}
