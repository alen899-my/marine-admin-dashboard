"use client";

import { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import ResourceFilters from "@/components/resources/ResourceFilters"; // ✅ Using the new specific filter
import AddResource from "./AddResource";
import TableCount from "@/components/common/TableCount";
import ResourceTable from "./ResourceTable"; 
import FilterToggleButton from "@/components/common/FilterToggleButton"; 
import { useFilterPersistence } from "@/hooks/useFilterPersistence";

export default function ResourceManagement() {
  const [refresh, setRefresh] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Persistence hook for "resources" module
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("resources");

  // --- Filter State (Clean & Minimal) ---
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const handleRefresh = () => setRefresh((prev) => prev + 1);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Resource Management
          </h2>
          <p className="text-sm text-gray-500">
            Manage system resources and their operational status.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <FilterToggleButton 
            isVisible={isFilterVisible} 
            onToggle={setIsFilterVisible} 
          />
          <AddResource onSuccess={handleRefresh} />
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