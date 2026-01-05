"use client";

import ComponentCard from "@/components/common/ComponentCard";
import UserFilters from "@/components/Users/UserFilters"; 
import { useState } from "react";
import AddUserButton from "./AddUserButton";
import UsersTable from "./UsersTable"; 
import FilterToggleButton from "@/components/common/FilterToggleButton"; // Shared Component
import { useFilterPersistence } from "@/hooks/useFilterPersistence"; // Shared Hook

export default function UserManagement() {
  const [refresh, setRefresh] = useState(0);

  // Use the shared persistent filter logic
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("users");

  // --- Filter State ---
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleRefresh = () => setRefresh((prev) => prev + 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          User Management
        </h2>
        
        <div className="flex items-center gap-3">
          {/* Shared Filter Toggle */}
          <FilterToggleButton 
            isVisible={isFilterVisible} 
            onToggle={setIsFilterVisible} 
          />
          <AddUserButton onSuccess={handleRefresh} />
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          isFilterVisible ? (
            <UserFilters
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
         <UsersTable
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