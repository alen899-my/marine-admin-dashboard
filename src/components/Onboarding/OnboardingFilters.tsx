"use client";

import { useEffect, useState } from "react";
import Input from "../form/input/InputField";
import SearchableSelect from "@/components/form/SearchableSelect";

export interface OnboardingFilterData {
  search: string;
  companyId: string;
  jobTitle: string;
}

interface OnboardingFiltersProps {
  search: string;
  companyId?: string;
  jobTitle?: string;
  companies?: any[];
  jobs?: { value: string; label: string }[];
  isSuperAdmin?: boolean;
  onApply: (data: OnboardingFilterData) => void;
}

export default function OnboardingFilters({
  search,
  companyId = "",
  jobTitle = "",
  companies = [],
  jobs = [],
  isSuperAdmin = false,
  onApply,
}: OnboardingFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [localCompanyId, setLocalCompanyId] = useState(companyId);
  const [localJobTitle, setLocalJobTitle] = useState(jobTitle);

  useEffect(() => { setLocalSearch(search); }, [search]);
  useEffect(() => { setLocalCompanyId(companyId); }, [companyId]);
  useEffect(() => { setLocalJobTitle(jobTitle); }, [jobTitle]);

  const handleApply = () => {
    onApply({ search: localSearch, companyId: localCompanyId, jobTitle: localJobTitle });
  };

  const handleClear = () => {
    setLocalSearch("");
    setLocalCompanyId("");
    setLocalJobTitle("");
    onApply({ search: "", companyId: "", jobTitle: "" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleApply();
  };

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 w-full">
      {/* SEARCH */}
      <div className="w-full sm:w-auto min-w-[280px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Search Candidate
        </label>
        <Input
          placeholder="Search by name, email, rank or nationality..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* COMPANY — Super Admin only */}
      {isSuperAdmin && companies.length > 0 && (
        <div className="w-full sm:w-auto min-w-[200px]">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
            Company
          </label>
          <SearchableSelect
            options={companies.map((c: any) => ({
              value: c.id || c._id,
              label: c.name,
            }))}
            placeholder="All Companies"
            value={localCompanyId}
            onChange={(val) => {
              const newCompanyId = val || "";
              setLocalCompanyId(newCompanyId);
              setLocalJobTitle("");
              onApply({ search: localSearch, companyId: newCompanyId, jobTitle: "" });
            }}
          />
        </div>
      )}

      {/* JOB TITLE */}
      <div className="w-full sm:w-auto min-w-[200px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Job Title
        </label>
        <SearchableSelect
          options={jobs}
          placeholder="All Job Titles"
          value={localJobTitle}
          onChange={(val) => setLocalJobTitle(val || "")}
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
