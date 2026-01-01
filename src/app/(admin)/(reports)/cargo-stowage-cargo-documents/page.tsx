"use client";

import ComponentCard from "@/components/common/ComponentCard";
import CargoReportTable from "./CargoReportTable";
import Filters from "@/components/common/Filters";
import { useState, useEffect } from "react";
import AddCargoButton from "./AddCragoButton";
import FilterToggleButton from "@/components/common/FilterToggleButton"; // Shared Component
import { useFilterPersistence } from "@/hooks/useFilterPersistence"; // Shared Hook

export default function CragoStowageCargoDocuments() {
  const [refresh, setRefresh] = useState(0);

  // Use the shared persistent filter logic
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
      {/* Header Section: Title on left, Buttons on right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Cargo Stowage & Cargo Documents
        </h2>

        <div className="flex items-center gap-3">
          {/* Shared Filter Toggle */}
          <FilterToggleButton 
            isVisible={isFilterVisible} 
            onToggle={setIsFilterVisible} 
          />
          <AddCargoButton onSuccess={handleRefresh} />
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
        <CargoReportTable
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