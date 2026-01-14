"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Filters from "@/components/common/Filters";
import FilterToggleButton from "@/components/common/FilterToggleButton"; // Shared Component
import TableCount from "@/components/common/TableCount";
import { useAuthorization } from "@/hooks/useAuthorization"; // ✅ Added
import { useFilterPersistence } from "@/hooks/useFilterPersistence"; // Shared Hook
import { useEffect, useState } from "react";
import AddVesselButton from "./AddVesselButton";
import VesselTable from "./VesselTable";

export default function VesselManagement() {
  const [refresh, setRefresh] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [companies, setCompanies] = useState([]);

  // ✅ Authorization logic
  const { can, isReady, user } = useAuthorization();
  const canView = can("vessels.view");
  const canAdd = can("vessels.create");

  const isSuperAdmin = user?.role?.toLowerCase() === "super-admin";

  // Use the shared persistent filter logic
  const { isFilterVisible, setIsFilterVisible } =
    useFilterPersistence("vessels");

  // --- Filter State ---
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [companyId, setCompanyId] = useState("all");
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
          You do not have permission to access Vessel Management.
        </p>
      </div>
    );
  }

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await fetch("/api/companies");
        if (res.ok) {
          const json = await res.json();
          setCompanies(json.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      }
    }

    if (isReady && isSuperAdmin) {
      fetchCompanies();
    }
  }, [isReady, isSuperAdmin]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Vessel Management
        </h2>

        <div className="flex items-center gap-3">
          {/* Shared Filter Toggle */}
          <FilterToggleButton
            isVisible={isFilterVisible}
            onToggle={setIsFilterVisible}
          />
          {/* ✅ Check permission for adding */}
          {canAdd && <AddVesselButton onSuccess={handleRefresh} />}
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
              companyId={companyId} // ✅ Pass Company ID
              setCompanyId={setCompanyId} // ✅ Pass Setter
              isSuperAdmin={isSuperAdmin}
              companies={companies}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              // Custom props for Vessel context
              searchVessel={true}
              optionOff={true}
            />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="Vessels" />
        </div>
        <VesselTable
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
