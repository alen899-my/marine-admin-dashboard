"use client";

import ComponentCard from "@/components/common/ComponentCard";
import CargoReportTable from "./CargoReportTable";
import Filters from "@/components/common/Filters";
import { useState } from "react";
import AddCargoButton from "./AddCragoButton";

export default function CragoStowageCargoDocuments() {
  const [refresh, setRefresh] = useState(0);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleRefresh = () => setRefresh((prev) => prev + 1);

  return (
    <div className="space-y-6">
      {/* Header Section: Title on left, Button on right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Cargo Stowage & Cargo Documents
        </h2>

        {/* Button moved here */}
        <AddCargoButton onSuccess={handleRefresh} />
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
          />
        }
      >
        <CargoReportTable
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
