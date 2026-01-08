"use client";

import { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton"; // Shared Component
import TableCount from "@/components/common/TableCount";
import { useFilterPersistence } from "@/hooks/useFilterPersistence"; // Shared Hook
import AddCompanyButton from "./AddCompanyButton";
import CompaniesTable from "./CompaniesTable";
import CompanyFilters from "@/components/Companies/CompanyFilters";

export default function CompanyManagement() {
  const [refresh, setRefresh] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Use the shared persistent filter logic for companies
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("companies");

  // --- Filter State ---
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleRefresh = () => setRefresh((prev) => prev + 1);

  return (
    <div className="space-y-6">
      {/* --- Header Section --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Company Management
        </h2>

        <div className="flex items-center gap-3">
          {/* Shared Filter Toggle */}
          <FilterToggleButton
            isVisible={isFilterVisible}
            onToggle={setIsFilterVisible}
          />
          <AddCompanyButton onSuccess={handleRefresh} />
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
        {/* Dynamic Count Display */}
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="companies" />
        </div>

        {/* Data Table */}
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