"use client";

import ComponentCard from "@/components/common/ComponentCard";
import ExportToExcel from "@/components/common/ExportToExcel";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { ReactNode, useEffect, useState } from "react";
import AddCargoButton from "./AddCragoButton"; // Note: Kept original import name
import CargoFilterWrapper from "./CargoFilterWrapper";
import { useAuthorization } from "@/hooks/useAuthorization";
const excelMapping = (r: any) => ({
    "Vessel Name": typeof r.vesselId === "object" ? r.vesselId?.name : r.vesselName,
    "Voyage ID": typeof r.voyageId === "object" ? r.voyageId?.voyageNo : r.voyageNo,
    "Port Name": r.portName || "-",
    "Port Type": (r.portType?.replace("_", " ") || "-") + " Port",
    "Document Type": r.documentType?.replace(/_/g, " ").toUpperCase() || "-",
    "Document Date": r.documentDate ? new Date(r.documentDate).toLocaleDateString("en-IN") : "-",
    "Report Date": r.reportDate ? new Date(r.reportDate).toLocaleString("en-IN") : "-",
    Status: r.status === "active" ? "Active" : "Inactive",
    "File URL": r.file?.url || "No Attachment",
    Remarks: r.remarks || "No Remarks",
});

interface CargoPageClientProps {
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

export default function CargoPageClient({
  children,
  data,
  totalCount,
  filterOptions,
  isSuperAdmin,
}: CargoPageClientProps) {
   const { can, isReady } = useAuthorization();
  const canView = can("cargo.view");
  const canCreate = can("cargo.create");
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("cargoDocuments");

  if (!isReady) return null;

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">
          You do not have permission to access Cargo Documents.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Cargo Stowage & Cargo Documents
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
              fileName="Cargo_Documents_Report"
              exportMap={excelMapping}
              className="w-full justify-center"
            />
          </div>

          <div className="w-full sm:w-auto">
            <AddCargoButton
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
            <CargoFilterWrapper
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