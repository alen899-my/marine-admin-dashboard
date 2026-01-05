"use client";

import { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import RoleFilters from "@/components/roles/RoleFilters";
import AddRoleButton from "./AddRoleButton";
import RolesTable from "./RolesTable";
import FilterToggleButton from "@/components/common/FilterToggleButton"; // Shared Component
import { useFilterPersistence } from "@/hooks/useFilterPersistence"; // Shared Hook

export default function RoleManagement() {
  const [refresh, setRefresh] = useState(0);

  // Use the shared persistent filter logic
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("roles");

  // --- Filter State ---
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleRefresh = () => setRefresh((prev) => prev + 1);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Roles & Permissions
        </h2>

        <div className="flex items-center gap-3">
          {/* Shared Filter Toggle */}
          <FilterToggleButton 
            isVisible={isFilterVisible} 
            onToggle={setIsFilterVisible} 
          />
          {/* Add Role Button */}
          <AddRoleButton onSuccess={handleRefresh} />
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          isFilterVisible ? (
            <RoleFilters
              search={search}
              setSearch={setSearch}
              status={status}
              setStatus={setStatus}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              showDateFilters={false}
            />
          ) : null
        }
      >
        <RolesTable
          refresh={refresh}
          search={search}
          status={status}
          startDate={startDate}
          endDate={endDate}
        /> 
      </ComponentCard>
    </div>
  );
}