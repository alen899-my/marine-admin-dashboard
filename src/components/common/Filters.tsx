"use client";

import { useState, useEffect } from "react";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import DatePicker from "@/components/form/date-picker";

export default function Filters({
  search,
  setSearch,
  status,
  setStatus,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: {
  search: string;
  setSearch: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  onButtonClick?: () => void;
  buttonLabel?: string;
}) {
  // 1. Create local state
  const [localSearch, setLocalSearch] = useState(search);
  const [localStatus, setLocalStatus] = useState(status);
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);

  // 2. Sync local state if parent props change
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    setLocalStatus(status);
  }, [status]);

  useEffect(() => {
    setLocalStartDate(startDate);
  }, [startDate]);

  useEffect(() => {
    setLocalEndDate(endDate);
  }, [endDate]);

  // 3. Handler to apply filters
  const handleApplyFilters = () => {
    setSearch(localSearch);
    setStatus(localStatus);
    setStartDate(localStartDate);
    setEndDate(localEndDate);
  };

  // 4. Handler to clear filters
  const handleClear = () => {
    // Reset local state
    setLocalSearch("");
    setLocalStatus("all");
    setLocalStartDate(""); // This updates the state
    setLocalEndDate("");   // This updates the state

    // Reset parent state
    setSearch("");
    setStatus("all");
    setStartDate("");
    setEndDate("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleApplyFilters();
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-end justify-between gap-3 p-1 dark:rounded-xl m-4">
      <div className="flex flex-col md:flex-row items-end gap-3 w-full">
        
        {/* SEARCH */}
        <div className="w-full md:w-74">
          <Input
            placeholder="Search by Vessel Name or Voyage No..."
            className="w-full" 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* STATUS DROPDOWN */}
        <div className="w-full md:w-40">
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

       {/* FROM DATE */}
        <div className="w-full md:w-44 flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">
            Report Date From
          </label>
          <DatePicker
            // ✅ KEY ADDED: This forces the component to remount when localStartDate changes (e.g., clears)
            key={localStartDate} 
            id="filter-start-date"
            placeholder="mm/dd/yyyy"
            defaultDate={localStartDate}
            onChange={(_, dateStr) => setLocalStartDate(dateStr)}
          />
        </div>

        {/* TO DATE */}
        <div className="w-full md:w-44 flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">
              Report Date To
          </label>
          <DatePicker
            // ✅ KEY ADDED: This forces the component to remount when localEndDate changes
            key={localEndDate}
            id="filter-end-date"
            placeholder="mm/dd/yyyy"
            defaultDate={localEndDate}
            onChange={(_, dateStr) => setLocalEndDate(dateStr)}
          />
        </div>

        {/* BUTTONS */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleApplyFilters}
            className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-2.5 rounded-lg transition-colors duration-200 whitespace-nowrap h-fit"
          >
            Search
          </button>

          <button
            onClick={handleClear}
            className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 font-medium px-6 py-2.5 rounded-lg transition-colors duration-200 whitespace-nowrap h-fit"
          >
            Clear
          </button>
        </div>

      </div>
    </div>
  );
}