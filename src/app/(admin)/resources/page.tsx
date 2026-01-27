"use client";

import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import ResourceFilters from "@/components/resources/ResourceFilters";
import { useAuthorization } from "@/hooks/useAuthorization"; //  Added
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { useState } from "react";
import AddResource from "./AddResource";
import ResourceTable from "./ResourceTable";

export default function ResourceManagement() {
  const [refresh, setRefresh] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Authorization hooks
  const { can, isReady } = useAuthorization();
  const canView = can("resource.view");
  const canAdd = can("resource.create");

  // Persistence hook for "resources" module
  const { isFilterVisible, setIsFilterVisible } =
    useFilterPersistence("resources");

  // --- Filter State ---
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("all");

  const handleRefresh = () => setRefresh((prev) => prev + 1);

  // Don't render anything until auth status is known
  if (!isReady) return null;

  // If user can't even view, show an access denied message or nothing
  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">
          You do not have permission to access Resource Management.
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
        title={
          isFilterVisible ? (
            <ResourceFilters
              search={search}
              setSearch={setSearch}
              status={status}
              setStatus={setStatus}
            />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="resources" />
        </div>

        <ResourceTable
          refresh={refresh}
          search={search}
          status={status}
          setTotalCount={setTotalCount}
        />
      </ComponentCard>
    </div>
  );
}
