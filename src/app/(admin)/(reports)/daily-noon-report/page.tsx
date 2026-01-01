"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Filters from "@/components/common/Filters";
import { useState, useEffect } from "react";
import AddDailyNoonReportButton from "./AddDailyNoonReportButton";
import DailyNoonReportTable from "./DailyNoonReportTable";
import FilterToggleButton from "@/components/common/FilterToggleButton"; 
import { useFilterPersistence } from "@/hooks/useFilterPersistence";

export default function DailyNoonReport() {
  const [refresh, setRefresh] = useState(0);
  
  // Use the shared hook
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [vesselId, setVesselId] = useState("");
  const [voyageId, setVoyageId] = useState("");
  const [vessels, setVessels] = useState([]);

  useEffect(() => {
    async function fetchVessels() {
      try {
        const res = await fetch("/api/vessels");
        if (res.ok) {
          const result = await res.json();
          setVessels(Array.isArray(result) ? result : result.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch vessels", error);
      }
    }
    fetchVessels();
  }, []);

  const handleRefresh = () => setRefresh((prev) => prev + 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Daily Noon Report
        </h2>

        <div className="flex items-center gap-3">
          {/* Use the shared UI component */}
          <FilterToggleButton 
            isVisible={isFilterVisible} 
            onToggle={setIsFilterVisible} 
          />
          
          <AddDailyNoonReportButton onSuccess={handleRefresh} />
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
              vesselId={vesselId}
              setVesselId={setVesselId}
              voyageId={voyageId}
              setVoyageId={setVoyageId}
              vessels={vessels}
            />
          ) : null
        }
      >
        <DailyNoonReportTable
          refresh={refresh}
          search={search}
          status={status}
          startDate={startDate}
          endDate={endDate}
          vesselId={vesselId}
          voyageId={voyageId}
          vesselList={vessels}
        />
      </ComponentCard>
    </div>
  );
}