"use client";

import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton"; // Shared Component
import TableCount from "@/components/common/TableCount";
import RoleFilters from "@/components/roles/RoleFilters";
import { useFilterPersistence } from "@/hooks/useFilterPersistence"; // Shared Hook
import { useState } from "react";
import AddRoleButton from "./AddRoleButton";
import RolesTable from "./RolesTable";
import { useAuthorization } from "@/hooks/useAuthorization"; // ✅ Added

export default function RoleManagement() {
  const [refresh, setRefresh] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // ✅ Authorization logic
  const { can, isReady } = useAuthorization();
  const canView = can("roles.view");
  const canCreate = can("roles.create");

  // Use the shared persistent filter logic
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("roles");

  // --- Filter State ---
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleRefresh = () => setRefresh((prev) => prev + 1);

  // 1. Wait for Auth check to complete
  if (!isReady) return null;

  // 2. Full Page Guard
  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">You do not have permission to access Roles & Permissions.</p>
      </div>
    );
  }

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
          {/* ✅ Check permission for creating roles */}
          {canCreate && <AddRoleButton onSuccess={handleRefresh} />}
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
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="roles" />
        </div>
        <RolesTable
          refresh={refresh}
          search={search}
          status={status}
          startDate={startDate}
          endDate={endDate}
          setTotalCount={setTotalCount}
        />
      </ComponentCard>
    </div>
  );
}