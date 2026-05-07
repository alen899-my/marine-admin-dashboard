"use client";

import { ReactNode } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import CrewFilterWrapper from "./CrewFilterWrapper";

interface CrewsPageClientProps {
  children: ReactNode;
  totalCount: number;
  companies: { id: string; name: string }[];
  jobs: { value: string; label: string }[];
  isSuperAdmin: boolean;
}

export default function CrewsPageClient({
  children,
  totalCount,
  companies,
  jobs,
  isSuperAdmin,
}: CrewsPageClientProps) {
  const { can, isReady } = useAuthorization();
  const canView = can("crews.view");
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("crews");

  if (!isReady) return null;

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">
          You do not have permission to access Crews.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Crews
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track crew profiles, employment records, compliance status, and assigned jobs.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="w-full flex justify-end sm:w-auto">
            <FilterToggleButton
              isVisible={isFilterVisible}
              onToggle={setIsFilterVisible}
            />
          </div>
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          isFilterVisible ? (
            <CrewFilterWrapper
              companies={companies}
              jobs={jobs}
              isSuperAdmin={isSuperAdmin}
            />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="Crews" />
        </div>
        {children}
      </ComponentCard>
    </div>
  );
}
