"use client";

import DatePicker from "@/components/form/date-picker";
import { useEffect, useState } from "react";
import Input from "../form/input/InputField";
import Select from "../form/Select";

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
}) {
  const [localSearch, setLocalSearch] = useState(search);
  const [localStatus, setLocalStatus] = useState(status);
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);

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
    setSearch("");
    setStatus("all");
    setStartDate("");
    setEndDate("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleApplyFilters();
  };

  return (
    /* CHANGE 1: Removed 'm-4' which causes double-spacing inside a card.
      CHANGE 2: Added 'flex-wrap' so items drop to the next line when zoomed.
    */
    <div className="flex flex-wrap items-end gap-4 p-4 w-full ms-2">
      
      {/* SEARCH: Changed md:w-74 to flex-grow with a max-width */}
      <div className="flex-1 min-w-[280px] max-w-full lg:max-w-md">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
          Search
        </label>
        <Input
          placeholder="Search by Vessel Name..."
          className="w-full"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* STATUS: Changed fixed width to a stable min-width */}
      <div className="w-full sm:w-auto min-w-[160px]">
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

      {/* FROM DATE */}
      <div className="w-full sm:w-auto min-w-[180px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
          Report Date From
        </label>
        <DatePicker
          key={localStartDate}
          id="filter-start-date"
          placeholder="dd/mm/yyyy"
          defaultDate={localStartDate}
          onChange={(_, dateStr) => setLocalStartDate(dateStr)}
        />
      </div>

      {/* TO DATE */}
      <div className="w-full sm:w-auto min-w-[180px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
          Report Date To
        </label>
        <DatePicker
          key={localEndDate}
          id="filter-end-date"
          placeholder="dd/mm/yyyy"
          defaultDate={localEndDate}
          onChange={(_, dateStr) => setLocalEndDate(dateStr)}
        />
      </div>

      {/* BUTTONS: Ensure they don't shrink and stay together */}
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