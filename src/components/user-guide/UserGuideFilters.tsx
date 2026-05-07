"use client";

import { useEffect, useState } from "react";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import SearchableSelect from "@/components/form/SearchableSelect";

export interface UserGuideFilterData {
  search: string;
  status: string;
  group: string;
}

interface UserGuideFiltersProps {
  search: string;
  status: string;
  group?: string;
  groups?: { value: string; label: string }[];
  roles?: { value: string; label: string }[];
  onApply: (data: UserGuideFilterData) => void;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function UserGuideFilters({
  search,
  status,
  group = "",
  groups = [],
  roles = [],
  onApply,
}: UserGuideFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [localStatus, setLocalStatus] = useState(status);
  const [localGroup, setLocalGroup] = useState(group);

  useEffect(() => { setLocalSearch(search); }, [search]);
  useEffect(() => { setLocalStatus(status); }, [status]);
  useEffect(() => { setLocalGroup(group); }, [group]);

  const handleApply = () => {
    onApply({ search: localSearch, status: localStatus, group: localGroup });
  };

  const handleClear = () => {
    setLocalSearch("");
    setLocalStatus("all");
    setLocalGroup("");
    onApply({ search: "", status: "all", group: "" });
  };

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 w-full">
      {/* SEARCH */}
      <div className="w-full sm:w-auto min-w-[280px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Search Sub Item
        </label>
        <Input
          placeholder="Search by sub item title..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
        />
      </div>

      {/* SECTION/GROUP */}
      <div className="w-full sm:w-auto min-w-[200px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Section (Group)
        </label>
        <SearchableSelect
          options={groups}
          placeholder="All Sections"
          value={localGroup}
          onChange={(val) => setLocalGroup(val || "")}
        />
      </div>

      {/* STATUS */}
      <div className="w-full sm:w-auto min-w-[200px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Status
        </label>
        <Select
          value={localStatus}
          onChange={setLocalStatus}
          options={STATUS_OPTIONS}
        />
      </div>

      {/* BUTTONS */}
      <div className="flex items-center gap-2 mt-2 sm:mt-0 ml-auto sm:ml-0">
        <button
          onClick={handleApply}
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
