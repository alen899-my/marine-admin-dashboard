"use client";

import { useEffect, useState } from "react";
import SearchableSelect from "@/components/form/SearchableSelect";
import Input from "@/components/form/input/InputField";

export interface CrewFilterData {
  search: string;
  companyId: string;
  jobTitle: string;
  crewStatus: string;
}

const CREW_STATUS_OPTIONS = [
  { value: "onboard", label: "Onboard" },
  { value: "vacation", label: "Vacation" },
  { value: "available", label: "Available" },
  { value: "traveling", label: "Traveling" },
  { value: "medical_leave", label: "Medical Leave" },
  { value: "training", label: "Training" },
  { value: "inactive", label: "Inactive" },
  { value: "resigned", label: "Resigned" },
  { value: "blacklisted", label: "Blacklisted" },
];

interface CrewFiltersProps {
  search: string;
  companyId?: string;
  jobTitle?: string;
  crewStatus?: string;
  companies?: { id?: string; _id?: string; name: string }[];
  jobs?: { value: string; label: string }[];
  isSuperAdmin?: boolean;
  onApply: (data: CrewFilterData) => void;
}

export default function CrewFilters({
  search,
  companyId = "",
  jobTitle = "",
  crewStatus = "",
  companies = [],
  jobs = [],
  isSuperAdmin = false,
  onApply,
}: CrewFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [localCompanyId, setLocalCompanyId] = useState(companyId);
  const [localJobTitle, setLocalJobTitle] = useState(jobTitle);
  const [localCrewStatus, setLocalCrewStatus] = useState(crewStatus);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    setLocalCompanyId(companyId);
  }, [companyId]);

  useEffect(() => {
    setLocalJobTitle(jobTitle);
  }, [jobTitle]);

  useEffect(() => {
    setLocalCrewStatus(crewStatus);
  }, [crewStatus]);

  const handleApply = () => {
    onApply({
      search: localSearch,
      companyId: localCompanyId,
      jobTitle: localJobTitle,
      crewStatus: localCrewStatus,
    });
  };

  const handleClear = () => {
    setLocalSearch("");
    setLocalCompanyId("");
    setLocalJobTitle("");
    setLocalCrewStatus("");
    onApply({ search: "", companyId: "", jobTitle: "", crewStatus: "" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleApply();
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 w-full">
      <div className="w-full sm:w-auto min-w-[280px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Search Crew
        </label>
        <Input
          placeholder="Search by name, email, rank or position..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {isSuperAdmin && companies.length > 0 && (
        <div className="w-full sm:w-auto min-w-[200px]">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
            Company
          </label>
          <SearchableSelect
            options={companies.map((company) => ({
              value: company.id || company._id || "",
              label: company.name,
            }))}
            placeholder="All Companies"
            value={localCompanyId}
            onChange={(value) => {
              setLocalCompanyId(value || "");
              setLocalJobTitle("");
            }}
          />
        </div>
      )}

      <div className="w-full sm:w-auto min-w-[200px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Position
        </label>
        <SearchableSelect
          options={jobs}
          placeholder="All Positions"
          value={localJobTitle}
          onChange={(value) => setLocalJobTitle(value || "")}
        />
      </div>

      <div className="w-full sm:w-auto min-w-[180px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Crew Status
        </label>
        <SearchableSelect
          options={CREW_STATUS_OPTIONS}
          placeholder="All Statuses"
          value={localCrewStatus}
          onChange={(value) => setLocalCrewStatus(value || "")}
        />
      </div>

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
