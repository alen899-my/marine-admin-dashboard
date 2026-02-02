"use client";

import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import AddPermissionButton from "./AddPermissionButton";
import PermissionFilterWrapper from "./PermissionFilterWrapper";

interface PermissionPageClientProps {
  children: ReactNode; // This will be the Table
  totalCount: number;
  resourceOptions: { id: string; name: string }[];
}

export default function PermissionPageClient({
  children,
  totalCount,
  resourceOptions,
}: PermissionPageClientProps) {
  const router = useRouter();
  
  // Authorization
  const { can, isReady } = useAuthorization();
  const canView = can("permission.view");
  const canAdd = can("permission.create");

  // Filter Persistence
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("permission");
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch for persistent filters
  useEffect(() => { setMounted(true); }, []);
  const effectiveFilterVisibility = mounted ? isFilterVisible : false;

  // 1. Loading State
  if (!isReady) return null;

  // 2. Access Denied State
  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">
          You do not have permission to access Permission Management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Permission Management
          </h2>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Filter Toggle */}
          <div className="w-full flex justify-end sm:w-auto">
            <FilterToggleButton
              isVisible={effectiveFilterVisibility}
              onToggle={setIsFilterVisible}
            />
          </div>

          {/* Add Button */}
          {canAdd && (
            <div className="w-full sm:w-auto">
              <AddPermissionButton
                onSuccess={() => router.refresh()}
                resourceOptions={resourceOptions}
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
            <PermissionFilterWrapper modules={resourceOptions} />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="permissions" />
        </div>
        
        {/* Render the Table passed from Server Page */}
        {children}
      </ComponentCard>
    </div>
  );
}