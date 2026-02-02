"use client";

import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import AddResource from "./AddResource";
import ResourceFilterWrapper from "./ResourceFilterWrapper";

interface ResourcePageClientProps {
  children: ReactNode;
  totalCount: number;
}

export default function ResourcePageClient({
  children,
  totalCount,
}: ResourcePageClientProps) {
  const router = useRouter();
  const { can, isReady } = useAuthorization();
  const canAdd = can("resource.create");

const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("resources");





  const handleRefresh = () => {
    router.refresh();
  };

  if (!isReady) return null;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Resource Management
          </h2>
        </div>
        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Desktop: First (Left) | Mobile: Bottom */}
          <div className="w-full flex justify-end sm:w-auto">
           <FilterToggleButton
              isVisible={isFilterVisible}
              onToggle={setIsFilterVisible}
            />
          </div>

          {/* Desktop: Second (Right) | Mobile: Top */}
          {canAdd && (
            <div className="w-full sm:w-auto">
              <AddResource
                onSuccess={handleRefresh}
                className="w-full justify-center"
              />
            </div>
          )}
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
       title={isFilterVisible ? <ResourceFilterWrapper /> : null}
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="resources" />
        </div>

        {children}
      </ComponentCard>
    </div>
  );
}