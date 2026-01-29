"use client";

import ComponentCard from "@/components/common/ComponentCard";
import ExportToExcel from "@/components/common/ExportToExcel";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { ReactNode, useEffect, useState } from "react";
import AddArrivalReportButton from "./AddArrivalReportButton";
import ArrivalFilterWrapper from "./ArrivalFilterWrapper";

const excelMapping = (r: any) => ({
    "Vessel Name": typeof r.vesselId === "object" ? r.vesselId?.name : r.vesselName,
    "Voyage ID": typeof r.voyageId === "object" ? r.voyageId?.voyageNo : r.voyageNo,
    "Port Name": r.portName || "-",
    "Arrival Time": r.eventTime ? new Date(r.eventTime).toLocaleString("en-IN") : "-",
    "NOR Tendered": r.norDetails?.norTime ? new Date(r.norDetails.norTime).toLocaleString("en-IN") : "-",
    "Report Date": r.reportDate ? new Date(r.reportDate).toLocaleString("en-IN") : "-",
    "Arrival Cargo (MT)": r.arrivalStats?.arrivalCargoQtyMt || 0,
    "ROB VLSFO (MT)": r.arrivalStats?.robVlsfo || 0,
    "ROB LSMGO (MT)": r.arrivalStats?.robLsmgo || 0,
    "Steaming Time (Hrs)": r.metrics?.totalTimeHours ?? "N/A",
    "Total Distance (NM)": r.metrics?.totalDistance ?? "N/A",
    "Avg Speed (Kts)": r.metrics?.avgSpeed ?? "N/A",
    "VLSFO Consumed (MT)": r.metrics?.consumedVlsfo ?? "N/A",
    "LSMGO Consumed (MT)": r.metrics?.consumedLsmgo ?? "N/A",
    Status: r.status === "active" ? "Active" : "Inactive",
    Remarks: r.remarks || "No Remarks",
});

interface ArrivalPageClientProps {
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

export default function ArrivalPageClient({
  children,
  data,
  totalCount,
  filterOptions,
  isSuperAdmin,
}: ArrivalPageClientProps) {
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("arrival");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  const effectiveFilterVisibility = mounted ? isFilterVisible : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Arrival Report
        </h2>

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="w-full flex justify-end sm:w-auto">
            <FilterToggleButton
              isVisible={effectiveFilterVisibility}
              onToggle={setIsFilterVisible}
            />
          </div>

          <div className="w-full sm:w-auto">
            <ExportToExcel
              data={data}
              fileName="Arrival_Reports"
              exportMap={excelMapping}
              className="w-full justify-center"
            />
          </div>

          <div className="w-full sm:w-auto">
            <AddArrivalReportButton
              vesselList={filterOptions.vessels}
              allVoyages={filterOptions.voyages} // ✅ Pass voyages
              className="w-full justify-center"
            />
          </div>
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          effectiveFilterVisibility ? (
            <ArrivalFilterWrapper
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