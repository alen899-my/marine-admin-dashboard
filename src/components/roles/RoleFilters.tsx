"use client";

import DatePicker from "@/components/form/date-picker";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { useEffect, useState } from "react";

interface RoleFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;

  //  Made date props optional
  startDate?: string;
  setStartDate?: (v: string) => void;
  endDate?: string;
  setEndDate?: (v: string) => void;

  //  New Prop to control visibility (default: true)
  showDateFilters?: boolean;
}

export default function RoleFilters({
  search,
  setSearch,
  status,
  setStatus,
  startDate = "", // Default to empty string if not provided
  setStartDate,
  endDate = "", // Default to empty string if not provided
  setEndDate,
  showDateFilters = true, // Default to showing dates
}: RoleFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [localStatus, setLocalStatus] = useState(status);

  // Initialize with fallback to empty string
  const [localStartDate, setLocalStartDate] = useState(startDate || "");
  const [localEndDate, setLocalEndDate] = useState(endDate || "");

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);
  useEffect(() => {
    setLocalStatus(status);
  }, [status]);
  useEffect(() => {
    setLocalStartDate(startDate || "");
  }, [startDate]);
  useEffect(() => {
    setLocalEndDate(endDate || "");
  }, [endDate]);

  const handleApplyFilters = () => {
    setSearch(localSearch);
    setStatus(localStatus);
    // Only call setters if they exist
    if (setStartDate) setStartDate(localStartDate);
    if (setEndDate) setEndDate(localEndDate);
  };

  const handleClear = () => {
    setLocalSearch("");
    setLocalStatus("all");
    setLocalStartDate("");
    setLocalEndDate("");

    setSearch("");
    setStatus("all");
    if (setStartDate) setStartDate("");
    if (setEndDate) setEndDate("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleApplyFilters();
  };

  return (
    <div className="flex flex-wrap lg:flex-nowrap items-end gap-4 p-4 w-full overflow-x-auto no-scrollbar">
      {/* SEARCH - Updated to match common component size */}
      <div className="w-full sm:w-auto min-w-[200px] shrink-0">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
          Search Roles
        </label>
        <Input
          placeholder="Search by Role Name..."
          className="w-full"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* STATUS - Updated to match common component size */}
      <div className="w-full sm:w-auto min-w-[210px] shrink-0">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
          Status
        </label>
        <Select
          className="w-full"
          value={localStatus}
          onChange={setLocalStatus}
          placeholder="Select status"
          options={[
            { value: "all", label: "All Status" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
      </div>

      {/*  CONDITIONALLY RENDER DATE PICKERS */}
      {showDateFilters && (
        <>
          {/* DATE FROM */}
          <div className="w-full sm:w-auto min-w-[180px] shrink-0">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
              Created From
            </label>
            <DatePicker
              key={localStartDate}
              id="role-start-date"
              placeholder="dd/mm/yyyy"
              defaultDate={localStartDate}
              onChange={(_, dateStr) => setLocalStartDate(dateStr)}
            />
          </div>

          {/* DATE TO */}
          <div className="w-full sm:w-auto min-w-[180px] shrink-0">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
              Created To
            </label>
            <DatePicker
              key={localEndDate}
              id="role-end-date"
              placeholder="dd/mm/yyyy"
              defaultDate={localEndDate}
              onChange={(_, dateStr) => setLocalEndDate(dateStr)}
            />
          </div>
        </>
      )}

      {/* BUTTONS */}
      <div className="flex items-center gap-2 mt-2 sm:mt-0  shrink-0">
        <button
          onClick={handleApplyFilters}
          className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-2.5 rounded-lg transition-colors whitespace-nowrap"
        >
          Search
        </button>
        <button
          onClick={handleClear}
          className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 font-medium px-6 py-2.5 rounded-lg transition-colors whitespace-nowrap"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
