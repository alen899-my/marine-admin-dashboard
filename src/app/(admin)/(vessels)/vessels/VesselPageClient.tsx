"use client";

import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { ReactNode, useEffect, useState } from "react";
import AddVesselButton from "./AddVesselButton";
import VesselFilterWrapper from "./VesselFilterWrapper";
import { useAuthorization } from "@/hooks/useAuthorization";

interface VesselPageClientProps {
  children: ReactNode;
  totalCount: number;
  companies: any[];
  isSuperAdmin: boolean;
  canAdd: boolean;
}

export default function VesselPageClient({
  children,
  totalCount,
  companies,
  isSuperAdmin,
  canAdd,
}: VesselPageClientProps) {
   const { can, isReady } = useAuthorization();
  const canView = can("vessels.view");
  const canCreate = can("vessels.create");

  const { isFilterVisible, setIsFilterVisible } =
    useFilterPersistence("vessels");

  if (!isReady) return null;

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">
          You do not have permission to access Vessel Management.
        </p>
      </div>
    );
  }
 

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Vessel Management
        </h2>

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="w-full flex justify-end sm:w-auto">
            <FilterToggleButton
              isVisible={isFilterVisible}
              onToggle={setIsFilterVisible}
            />
          </div>

          {canCreate && (
            <div className="w-full sm:w-auto">
              <AddVesselButton className="w-full justify-center" />
            </div>
          )}
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          isFilterVisible ? (
            <VesselFilterWrapper
              companies={companies}
              isSuperAdmin={isSuperAdmin}
            />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="Vessels" />
        </div>

        {children}
      </ComponentCard>
    </div>
  );
}
