"use client";

import { useEffect, useState } from "react";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import SearchableSelect from "@/components/form/SearchableSelect";

export interface JobPostingFilterData {
  search: string;
  isAccepting: string;
  companyId: string;
}

interface JobPostingFiltersProps {
  search: string;
  isAccepting: string;
  companyId?: string;
  companies?: { value: string; label: string }[];
  isSuperAdmin?: boolean;
  onApply: (data: JobPostingFilterData) => void;
}

const ACCEPTING_OPTIONS = [
  { value: "all", label: "All" },
  { value: "true", label: "Accepting" },
  { value: "false", label: "Not Accepting" },
];

export default function JobPostingFilters({
  search,
  isAccepting,
  companyId = "",
  companies = [],
  isSuperAdmin = false,
  onApply,
}: JobPostingFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [localAccepting, setLocalAccepting] = useState(isAccepting);
  const [localCompanyId, setLocalCompanyId] = useState(companyId);

  useEffect(() => { setLocalSearch(search); }, [search]);
  useEffect(() => { setLocalAccepting(isAccepting); }, [isAccepting]);
  useEffect(() => { setLocalCompanyId(companyId); }, [companyId]);

  const handleApply = () => {
    onApply({ search: localSearch, isAccepting: localAccepting, companyId: localCompanyId });
  };

  const handleClear = () => {
    setLocalSearch("");
    setLocalAccepting("all");
    setLocalCompanyId("");
    onApply({ search: "", isAccepting: "all", companyId: "" });
  };

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 w-full">
      {/* SEARCH */}
      <div className="w-full sm:w-auto min-w-[280px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Search Job
        </label>
        <Input
          placeholder="Search by job title..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
        />
      </div>

      {/* ACCEPTING */}
      <div className="w-full sm:w-auto min-w-[200px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Accepting
        </label>
        <Select
          value={localAccepting}
          onChange={setLocalAccepting}
          options={ACCEPTING_OPTIONS}
        />
      </div>

      {/* COMPANY — Super Admin only */}
      {isSuperAdmin && companies.length > 0 && (
        <div className="w-full sm:w-auto min-w-[200px]">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
            Company
          </label>
          <SearchableSelect
            options={companies}
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