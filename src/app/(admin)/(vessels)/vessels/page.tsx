"use client";

import { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import Filters from "@/components/common/Filters";
import AddVesselButton from "./AddVesselButton";
import VesselTable from "./VesselTable"; // Fixed typo from 'VessekTable'

export default function VesselManagement() {
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
          Vessel Management
        </h2>
        
        {/* Add Vessel Button triggers refresh on success */}
        <AddVesselButton onSuccess={handleRefresh} />
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
            // Custom props for Vessel context
            searchVessel={true}
            optionOff={true}
          />
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