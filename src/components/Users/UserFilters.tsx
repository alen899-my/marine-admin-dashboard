"use client";

import DatePicker from "@/components/form/date-picker";
import { useEffect, useState } from "react";
import Input from "../form/input/InputField";
import Select from "../form/Select";

// Defined props to match the UserManagement page state
interface UserFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
}

export default function UserFilters({
  search,
  setSearch,
  status,
  setStatus,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: UserFiltersProps) {
  // Local state for debounced/deferred updates
  const [localSearch, setLocalSearch] = useState(search);
  const [localStatus, setLocalStatus] = useState(status);
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);

  // Sync local state if parent state changes externally (e.g. refresh)
  useEffect(() => { setLocalSearch(search); }, [search]);
  useEffect(() => { setLocalStatus(status); }, [status]);
  useEffect(() => { setLocalStartDate(startDate); }, [startDate]);
  useEffect(() => { setLocalEndDate(endDate); }, [endDate]);

  const handleApplyFilters = () => {
    setSearch(localSearch);
    setStatus(localStatus);
    setStartDate(localStartDate);
    setEndDate(localEndDate);
  };

  const handleClear = () => {
    setLocalSearch("");
    setLocalStatus("all");
    setLocalStartDate("");
    setLocalEndDate("");
    
    // Immediately clear parent state too
    setSearch("");
    setStatus("all");
    setStartDate("");
    setEndDate("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleApplyFilters();
  };

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 w-full ms-2">
      
      {/* SEARCH */}
      <div className="flex-1 min-w-[280px] max-w-full lg:max-w-md">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
          Search Users
        </label>
        <Input
          placeholder="Search by Name, Email, Phone..."
          className="w-full"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* STATUS FILTER */}
      <div className="w-full sm:w-auto min-w-[160px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
          Account Status
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

      {/* JOINED DATE FROM
      <div className="w-full sm:w-auto min-w-[180px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
          Joined Date From
        </label>
        <DatePicker
          key={localStartDate}
          id="filter-start-date"
          placeholder="dd/mm/yyyy"
          defaultDate={localStartDate}
          onChange={(_, dateStr) => setLocalStartDate(dateStr)}
        />
      </div>

      
      <div className="w-full sm:w-auto min-w-[180px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
          Joined Date To
        </label>
        <DatePicker
          key={localEndDate}
          id="filter-end-date"
          placeholder="dd/mm/yyyy"
          defaultDate={localEndDate}
          onChange={(_, dateStr) => setLocalEndDate(dateStr)}
        />
      </div> */}

      {/* ACTION BUTTONS */}
      <div className="flex items-center gap-2 mt-2 sm:mt-0 ml-auto sm:ml-0">
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