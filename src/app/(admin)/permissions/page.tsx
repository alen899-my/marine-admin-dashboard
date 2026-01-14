"use client";

import { useState, useEffect } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton"; 
import { useFilterPersistence } from "@/hooks/useFilterPersistence"; 
import TableCount from "@/components/common/TableCount";
import { useAuthorization } from "@/hooks/useAuthorization"; // ✅ Added

// Permission Components
import PermissionTable from "./PermissionTable";
import AddPermissionButton from "./AddPermissionButton";
import PermissionFilter from "@/components/permissions/permissionFilter";

export default function PermissionManagement() {
  const [refresh, setRefresh] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  // ✅ Authorization logic
  const { can, isReady } = useAuthorization();
  const canView = can("permission.view");
  const canAdd = can("permission.create");

  // Use the shared persistent filter logic
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("permission");
  const [hasFetchedModules, setHasFetchedModules] = useState(false);
  // --- Filter State ---
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [module, setModule] = useState("");
  const [modules, setModules] = useState<{ id: string; name: string }[]>([]);

  const handleRefresh = () => setRefresh((prev) => prev + 1);



  // 1. Wait for Auth to load
  if (!isReady) return null;

  // 2. Gate the entire page
  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">You do not have permission to access Permission Management.</p>
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
          <p className="text-sm text-gray-500">
            Manage system-wide permissions and access resources.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <FilterToggleButton 
            isVisible={isFilterVisible} 
            onToggle={setIsFilterVisible} 
          />
          {/* ✅ Check permission for adding */}
          {canAdd && <AddPermissionButton onSuccess={handleRefresh} resourceOptions={modules} />}
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
          resourceOptions={modules}
          setResourceOptions={setModules}
        />
      </ComponentCard>
    </div>
  );
}