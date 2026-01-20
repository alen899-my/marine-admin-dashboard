"use client";

import { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton"; 
import TableCount from "@/components/common/TableCount";
import { useFilterPersistence } from "@/hooks/useFilterPersistence"; 
import AddCompanyButton from "./AddCompanyButton";
import CompaniesTable from "./CompaniesTable";
import CompanyFilters from "@/components/Companies/CompanyFilters";
import { useAuthorization } from "@/hooks/useAuthorization"; 

export default function CompanyManagement() {
  const [refresh, setRefresh] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // ✅ Authorization logic
  const { can, isReady } = useAuthorization();
  const canView = can("company.view");
  const canAdd = can("company.create");

  // Use the shared persistent filter logic for companies
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("companies");

  // --- Filter State ---
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleRefresh = () => setRefresh((prev) => prev + 1);

  // 1. Wait for Auth check
  if (!isReady) return null;

  // 2. Full Page Guard
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
      {/* --- Header Section --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Company Management
        </h2>

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
      <AddCompanyButton 
        onSuccess={handleRefresh} 
        className="w-full justify-center"
      />
    </div>
  )}
</div>
      </div>

      {/* --- Main Content Card --- */}
      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          isFilterVisible ? (
            <CompanyFilters
              search={search}
              setSearch={setSearch}
              status={status}
              setStatus={setStatus}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
            />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="companies" />
        </div>

        <CompaniesTable
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