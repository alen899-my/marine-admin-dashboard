"use client";

import ComponentCard from "@/components/common/ComponentCard";
// 1. Change Import
import UserFilters from "@/components/Users/UserFilters"; 
import { useState } from "react";
import AddUserButton from "./AddUserButton";
import UsersTable from "./UsersTable"; 

export default function UserManagement() {
  const [refresh, setRefresh] = useState(0);

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
        <AddUserButton onSuccess={handleRefresh} />
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          // 2. Use the new UserFilters component
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