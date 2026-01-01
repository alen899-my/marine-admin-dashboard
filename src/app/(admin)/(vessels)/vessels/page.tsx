"use client";

import { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Filters from "@/components/common/Filters";
import AddVesselButton from "./AddVesselButton";
import VesselTable from "./VesselTable"; 
import FilterToggleButton from "@/components/common/FilterToggleButton"; // Shared Component
import { useFilterPersistence } from "@/hooks/useFilterPersistence"; // Shared Hook

export default function VesselManagement() {
  const [refresh, setRefresh] = useState(0);

  // Use the shared persistent filter logic
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence();

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
          Vessel Management
        </h2>
        
        <div className="flex items-center gap-3">
          {/* Shared Filter Toggle */}
          <FilterToggleButton 
            isVisible={isFilterVisible} 
            onToggle={setIsFilterVisible} 
          />
          {/* Add Vessel Button triggers refresh on success */}
          <AddVesselButton onSuccess={handleRefresh} />
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          isFilterVisible ? (
            <Filters
              search={search}
              setSearch={setSearch}
              status={status}
              setStatus={setStatus}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              // Custom props for Vessel context
              searchVessel={true}
              optionOff={true}
            />
          ) : null
        }
      >
        <VesselTable
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