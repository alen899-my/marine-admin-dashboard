"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Filters from "@/components/common/Filters"; // Imported Filters
import { useState, useEffect } from "react";
import AddDailyNoonReportButton from "./AddDailyNoonReportButton";
import DailyNoonReportTable from "./DailyNoonReportTable";

export default function DailyNoonReport() {
  const [refresh, setRefresh] = useState(0);

  // --- Moved State from Table to Page ---
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
      {/* Header Section: Title on left, Button on right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Daily Noon Report
        </h2>

        {/* Button moved here */}
        <AddDailyNoonReportButton onSuccess={handleRefresh} />
      </div>

      {/* Card Section: Action prop removed */}
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
            vesselId={vesselId}
            setVesselId={setVesselId}
            voyageId={voyageId}
            setVoyageId={setVoyageId}
            vessels={vessels}
          />
        }
      >
        <DailyNoonReportTable
          refresh={refresh}
          // Passing filter props down
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