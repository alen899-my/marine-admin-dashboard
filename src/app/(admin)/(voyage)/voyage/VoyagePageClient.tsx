"use client";

import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { ReactNode, useEffect, useState } from "react";
import AddVoyage from "./AddVoyage";
import VoyageFilterWrapper from "./VoyageFilterWrapper";

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
  const { isFilterVisible, setIsFilterVisible } =
    useFilterPersistence("voyage");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const effectiveFilterVisibility = mounted ? isFilterVisible : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Voyage Management
        </h2>

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="w-full flex justify-end sm:w-auto">
            <FilterToggleButton
              isVisible={effectiveFilterVisibility}
              onToggle={setIsFilterVisible}
            />
          </div>

          {canAdd && (
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
          effectiveFilterVisibility ? (
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
