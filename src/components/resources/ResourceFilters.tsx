"use client";

import { useEffect, useState } from "react";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import Button from "@/components/ui/button/Button";

interface ResourceFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
}

export default function ResourceFilters({
  search,
  setSearch,
  status,
  setStatus,
}: ResourceFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [localStatus, setLocalStatus] = useState(status);

  // Sync local state when parent state changes (e.g., on Reset)
  useEffect(() => { setLocalSearch(search); }, [search]);
  useEffect(() => { setLocalStatus(status); }, [status]);

  const handleApplyFilters = () => {
    setSearch(localSearch);
    setStatus(localStatus);
  };

  const handleClear = () => {
    setLocalSearch("");
    setLocalStatus("all");
    setSearch("");
    setStatus("all");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleApplyFilters();
  };

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 w-full">
      {/* SEARCH */}
      <div className="w-full sm:w-auto min-w-[280px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Search Resource
        </label>
        <Input
          placeholder="Search by resource name..."
          className="w-full"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* STATUS */}
      <div className="w-full sm:w-auto min-w-[200px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Status
        </label>
        <Select
          className="w-full"
          value={localStatus}
          onChange={setLocalStatus}
          options={[
            { value: "all", label: "All Status" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex items-center gap-2 mt-2 sm:mt-0 ml-auto sm:ml-0">
        <Button
          size="md"
          variant="primary"
          onClick={handleApplyFilters}
          className="px-6"
        >
          Search
        </Button>
        <Button
          size="md"
          variant="outline"
          onClick={handleClear}
          className="px-6"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}