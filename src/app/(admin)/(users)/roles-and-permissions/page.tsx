"use client";

import { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import RoleFilters from "@/components/roles/RoleFilters"; // Using the component created above
import AddRoleButton from "./AddRoleButton";
import RolesTable from "./RolesTable"; // Table component deferred as requested

export default function RoleManagement() {
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
          Roles & Permissions
        </h2>

        {/* Add Role Button */}
        <AddRoleButton onSuccess={handleRefresh} />
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          <RoleFilters
            search={search}
            setSearch={setSearch}
            status={status}
            setStatus={setStatus}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            showDateFilters={false}
          />
        }
      >
    
        
       <RolesTable
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