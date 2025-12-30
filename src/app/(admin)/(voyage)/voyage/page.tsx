"use client";

import { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Filters from "@/components/common/Filters";
import AddVoyage from "./AddVoyage";
import VoyageTable from "./VoyageTable"; 

export default function VoyageManagement() {
  const [refresh, setRefresh] = useState(0);

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
          Voyage Management
        </h2>
        
        {/* Add Voyage Button triggers refresh on success */}
        <AddVoyage onSuccess={handleRefresh} />
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
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
        }
      >
        <VoyageTable
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