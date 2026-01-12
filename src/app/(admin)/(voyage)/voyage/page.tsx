"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Filters from "@/components/common/Filters";
import FilterToggleButton from "@/components/common/FilterToggleButton"; // Shared Component
import TableCount from "@/components/common/TableCount";
import { useFilterPersistence } from "@/hooks/useFilterPersistence"; // Shared Hook
import { useState,useEffect } from "react";
import AddVoyage from "./AddVoyage";
import VoyageTable from "./VoyageTable";
import { useAuthorization } from "@/hooks/useAuthorization"; 

export default function VoyageManagement() {
  const [refresh, setRefresh] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  const { can, isReady } = useAuthorization();
  
  // Use the shared persistent filter logic
  const { isFilterVisible, setIsFilterVisible } =
    useFilterPersistence("voyage");

  // ✅ Permissions logic
 
  const [vessels, setVessels] = useState<any[]>([]);
  const canView = can("voyage.view"); 
  const canAdd = can("voyage.create");

  // --- Filter State ---
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  useEffect(() => {
    async function fetchVessels() {
      try {
        const res = await fetch("/api/vessels?status=active&fields=name,_id"); // ⚡ Projection for speed
        if (res.ok) {
          const result = await res.json();
          setVessels(Array.isArray(result) ? result : result.data || []);
        }
      } catch (err) { console.error(err); }
    }
    if (isReady) fetchVessels();
  }, [isReady]);
  const handleRefresh = () => setRefresh((prev) => prev + 1);

  // 1. Wait for Auth check
  if (!isReady) return null;

  // 2. Full Page Guard
  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">You do not have permission to access Voyage Management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Voyage Management
        </h2>

        <div className="flex items-center gap-3">
          {/* Shared Filter Toggle */}
          <FilterToggleButton
            isVisible={isFilterVisible}
            onToggle={setIsFilterVisible} 
          />
          {/* ✅ Check permission for adding */}
          {canAdd && <AddVoyage onSuccess={handleRefresh}  vesselList={vessels}/>}
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
              // Updated search prop for Voyage context
              searchVoyage={true}
              optionOff={true}
            />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="voyages" />
        </div>
        <VoyageTable
          refresh={refresh}
          search={search}
          status={status}
          vesselList={vessels}
          startDate={startDate}
          endDate={endDate}
          setTotalCount={setTotalCount}
        />
      </ComponentCard>
    </div>
  );
}