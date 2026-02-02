"use client";

import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import AddCompanyButton from "./AddCompanyButton";
import CompanyFilterWrapper from "./CompanyFilterWrapper";

interface CompanyPageClientProps {
  children: ReactNode;
  totalCount: number;
}

export default function CompanyPageClient({ children, totalCount }: CompanyPageClientProps) {
  const router = useRouter();
  const { can, isReady } = useAuthorization();
  const canView = can("company.view");
  const canAdd = can("company.create");

  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("companies");
 

  if (!isReady) return null;

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">
          You do not have permission to access Company Management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Company Management
        </h2>

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="w-full flex justify-end sm:w-auto">
            <FilterToggleButton
              isVisible={isFilterVisible}
              onToggle={setIsFilterVisible}
            />
          </div>

          {canAdd && (
            <div className="w-full sm:w-auto">
              <AddCompanyButton
                onSuccess={() => router.refresh()}
                className="w-full justify-center"
              />
            </div>
          )}
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={isFilterVisible ? <CompanyFilterWrapper /> : null}
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="companies" />
        </div>
        
        {children}
      </ComponentCard>
    </div>
  );
}