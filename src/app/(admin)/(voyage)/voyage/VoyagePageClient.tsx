"use client";

import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { ReactNode, useEffect, useState } from "react";
import AddVoyage from "./AddVoyage";
import VoyageFilterWrapper from "./VoyageFilterWrapper";
import { useAuthorization } from "@/hooks/useAuthorization";
interface VoyagePageClientProps {
  children: ReactNode;
  totalCount: number;
  companies: any[];
  vessels: any[];
  isSuperAdmin: boolean;
  canAdd: boolean;
}

export default function VoyagePageClient({
  children,
  totalCount,
  companies,
  vessels,
  isSuperAdmin,
  canAdd,
}: VoyagePageClientProps) {
    const { can, isReady } = useAuthorization();
  const canView = can("voyage.view");
  const canCreate = can("voyage.create");
  const { isFilterVisible, setIsFilterVisible } =
    useFilterPersistence("voyage");


  if (!isReady) return null;

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">
          You do not have permission to access Voyage Management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Voyage Management
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
              <AddVoyage
                vesselList={vessels}
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
            <VoyageFilterWrapper
              companies={companies}
              isSuperAdmin={isSuperAdmin}
            />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="voyages" />
        </div>

        {children}
      </ComponentCard>
    </div>
  );
}
