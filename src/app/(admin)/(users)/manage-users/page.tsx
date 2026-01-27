"use client";

import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton"; // Shared Component
import TableCount from "@/components/common/TableCount";
import UserFilters from "@/components/Users/UserFilters";
import { useAuthorization } from "@/hooks/useAuthorization"; //  Added
import { useFilterPersistence } from "@/hooks/useFilterPersistence"; // Shared Hook
import { useState } from "react";
import AddUserButton from "./AddUserButton";
import UsersTable from "./UsersTable";

export default function UserManagement() {
  const [refresh, setRefresh] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  //  Authorization logic
  const { can, isReady, user } = useAuthorization();
  const canView = can("users.view");
  const canAdd = can("users.create");
  const isSuperAdmin = user?.role?.toLowerCase() === "super-admin";

  // Use the shared persistent filter logic
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("users");

  // --- Filter State ---
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [companyId, setCompanyId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleRefresh = () => setRefresh((prev) => prev + 1);

  // 1. Wait for Auth check
  if (!isReady) return null;

  // 2. Full Page Guard
  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">
          You do not have permission to access User Management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          User Management
        </h2>

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Desktop: First (Left) | Mobile: Bottom */}
          <div className="w-full flex justify-end sm:w-auto">
            <FilterToggleButton
              isVisible={isFilterVisible}
              onToggle={setIsFilterVisible}
            />
          </div>

          {/* Desktop: Second (Right) | Mobile: Top */}
          {canAdd && (
            <div className="w-full sm:w-auto">
              <AddUserButton
                onSuccess={handleRefresh}
                className="w-full justify-center"
              />
            </div>
          )}
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          isFilterVisible ? (
            <UserFilters
              search={search}
              setSearch={setSearch}
              status={status}
              setStatus={setStatus}
              companyId={companyId}
              setCompanyId={setCompanyId}
              isSuperAdmin={isSuperAdmin}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
            />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="users" />
        </div>
        <UsersTable
          refresh={refresh}
          search={search}
          status={status}
          companyId={companyId}
          startDate={startDate}
          endDate={endDate}
          setTotalCount={setTotalCount}
        />
      </ComponentCard>
    </div>
  );
}
