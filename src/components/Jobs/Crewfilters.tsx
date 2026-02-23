"use client";

import { useEffect, useState } from "react";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import SearchableSelect from "@/components/form/SearchableSelect";

export interface CrewFilterData {
  search: string;
  status: string;
  companyId: string;
}

interface CrewFiltersProps {
  search: string;
  status: string;
  companyId?: string;
  companies?: any[];
  isSuperAdmin?: boolean;
  onApply: (data: CrewFilterData) => void;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "reviewing", label: "Reviewing" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "on_hold", label: "On Hold" },
  { value: "archived", label: "Archived" },
];

export default function CrewFilters({
  search,
  status,
  companyId = "",
  companies = [],
  isSuperAdmin = false,
  onApply,
}: CrewFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [localStatus, setLocalStatus] = useState(status);
  const [localCompanyId, setLocalCompanyId] = useState(companyId);

  useEffect(() => { setLocalSearch(search); }, [search]);
  useEffect(() => { setLocalStatus(status); }, [status]);
  useEffect(() => { setLocalCompanyId(companyId); }, [companyId]);

  const handleApply = () => {
    onApply({
      search: localSearch,
      status: localStatus,
      companyId: localCompanyId,
    });
  };

  const handleClear = () => {
    setLocalSearch("");
    setLocalStatus("all");
    setLocalCompanyId("");
    onApply({ search: "", status: "all", companyId: "" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleApply();
  };

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 w-full">

      {/* SEARCH */}
      <div className="w-full sm:w-auto min-w-[280px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Search Crew
        </label>
        <Input
          placeholder="Search by name, email, rank or nationality..."
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
          value={localStatus}
          onChange={setLocalStatus}
          options={STATUS_OPTIONS}
          placeholder="All Status"
        />
      </div>

      {/* COMPANY — Super Admin only */}
      {isSuperAdmin && companies.length > 0 && (
        <div className="w-full sm:w-auto min-w-[200px]">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
            Company
          </label>
          <SearchableSelect
            options={companies.map((c: any) => ({ value: c._id, label: c.name }))}
            placeholder="All Companies"
            value={localCompanyId}
            onChange={(val) => setLocalCompanyId(val || "")}
          />
        </div>
      )}

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