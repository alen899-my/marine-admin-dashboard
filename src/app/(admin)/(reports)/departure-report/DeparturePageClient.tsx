"use client";

import ComponentCard from "@/components/common/ComponentCard";
import ExportToExcel from "@/components/common/ExportToExcel";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { ReactNode, useEffect, useState } from "react";
import AddDepartureReportButton from "./AddDepartureReportButton";
import DepartureFilterWrapper from "./DepartureFilterWrapper";
import { useAuthorization } from "@/hooks/useAuthorization";
// Excel Mapping
const excelMapping = (r: any) => ({
    "Vessel Name": typeof r.vesselId === "object" && r.vesselId ? r.vesselId.name : r.vesselName || "-",
    "Voyage ID": typeof r.voyageId === "object" && r.voyageId ? r.voyageId.voyageNo : r.voyageNo || "-",
    "Current Port": r.portName || "-",
    "Last Port": r.lastPort || "-",
    "Departure Time": r.eventTime ? new Date(r.eventTime).toLocaleString("en-IN") : "-",
    "Report Date": r.reportDate ? new Date(r.reportDate).toLocaleString("en-IN") : "-",
    "Dist to Next Port (NM)": r.navigation?.distanceToNextPortNm ?? 0,
    "ETA Next Port": r.navigation?.etaNextPort ? new Date(r.navigation.etaNextPort).toLocaleString("en-IN") : "-",
    "ROB VLSFO (MT)": r.departureStats?.robVlsfo ?? 0,
    "ROB LSMGO (MT)": r.departureStats?.robLsmgo ?? 0,
    "Bunkers Recv VLSFO": r.departureStats?.bunkersReceivedVlsfo ?? 0,
    "Bunkers Recv LSMGO": r.departureStats?.bunkersReceivedLsmgo ?? 0,
    "Cargo Loaded (MT)": r.departureStats?.cargoQtyLoadedMt ?? 0,
    "Cargo Unloaded (MT)": r.departureStats?.cargoQtyUnloadedMt ?? 0,
    "Cargo Summary": r.departureStats?.cargoSummary || "-",
    Status: r.status === "active" ? "Active" : "Inactive",
    Remarks: r.remarks || "",
});

interface DeparturePageClientProps {
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

export default function DeparturePageClient({
  children,
  data,
  totalCount,
  filterOptions,
  isSuperAdmin,
}: DeparturePageClientProps) {
    const { can, isReady } = useAuthorization();
  const canView = can("departure.view");
  const canCreate = can("departure.create");
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("departure");

    if (!isReady) return null;

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">
          You do not have permission to access Departure Reports.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Departure Report
        </h2>

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="w-full flex justify-end sm:w-auto">
            <FilterToggleButton
              isVisible={isFilterVisible}
              onToggle={setIsFilterVisible}
            />
          </div>

          <div className="w-full sm:w-auto">
            <ExportToExcel
              data={data}
              fileName="Departure_Reports"
              exportMap={excelMapping}
              className="w-full justify-center"
            />
          </div>

          <div className="w-full sm:w-auto">
            <AddDepartureReportButton
              vesselList={filterOptions.vessels}
              allVoyages={filterOptions.voyages}
              className="w-full justify-center"
            />
          </div>
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          isFilterVisible ? (
            <DepartureFilterWrapper
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

        {children}
      </ComponentCard>
    </div>
  );
}