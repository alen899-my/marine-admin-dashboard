"use client";

import { useState, useEffect } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton"; 
import { useFilterPersistence } from "@/hooks/useFilterPersistence"; 
import TableCount from "@/components/common/TableCount";
// Permission Components
import PermissionTable from "./PermissionTable";
import AddPermissionButton from "./AddPermissionButton";
import PermissionFilter from "@/components/permissions/permissionFilter";

export default function PermissionManagement() {
  const [refresh, setRefresh] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
  // Use the shared persistent filter logic (Key: "permission")
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("permission");

  // --- Filter State ---
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [module, setModule] = useState("");
  const [modules, setModules] = useState<{ id: string; name: string }[]>([]);

  const handleRefresh = () => setRefresh((prev) => prev + 1);

  useEffect(() => {
    async function fetchFilterData() {
      try {
        // 1. Fetch ONLY Active Resource documents for the filter dropdown
        const resResources = await fetch("/api/resources?limit=none&status=active");
        const resourcesData = await resResources.json();
        
        // Ensure we handle both direct array or paginated object shape
        const resourceList = Array.isArray(resourcesData) ? resourcesData : (resourcesData.data || []);
        
        // 2. Map directly to { id, name } objects
        const finalModules = resourceList.map((r: any) => ({
          id: r._id,
          name: r.name
        }));

        // 3. Sort alphabetically and update state
        setModules(finalModules.sort((a: any, b: any) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error("Failed to load filter modules", err);
      }
    }
    fetchFilterData();
  }, [refresh]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Permission Management
          </h2>
          <p className="text-sm text-gray-500">
            Manage system-wide permissions and access resources.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <FilterToggleButton 
            isVisible={isFilterVisible} 
            onToggle={setIsFilterVisible} 
          />
          <AddPermissionButton onSuccess={handleRefresh} />
        </div>
      </div>

      <ComponentCard 
        headerClassName="p-0 px-1"
        title={
          isFilterVisible ? (
            <PermissionFilter
              search={search}
              setSearch={setSearch}
              status={status}
              setStatus={setStatus}
              module={module}
              setModule={setModule}
              modules={modules}
            />
          ) : null
        }
      >
          <div className="flex justify-end me-2 mb-2">
                  <TableCount count={totalCount} label="permissions" />
                </div>
        <PermissionTable
          refresh={refresh}
          search={search}
          status={status}
          module={module}
          setTotalCount={setTotalCount}
        />
      </ComponentCard>
    </div>
  );
}