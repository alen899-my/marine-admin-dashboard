"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import SearchableSelect from "@/components/form/SearchableSelect";

interface SalaryHeadFiltersProps {
  search: string;
  status: string;
  companyId?: string;
  isSuperAdmin?: boolean;
  companyOptions?: { value: string; label: string }[];
  onApply: (search: string, status: string, companyId: string) => void;
}

export default function SalaryHeadFilters({
  search,
  status,
  companyId = "",
  isSuperAdmin = false,
  companyOptions = [],
  onApply,
}: SalaryHeadFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [localStatus, setLocalStatus] = useState(status);
  const [localCompanyId, setLocalCompanyId] = useState(companyId);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    setLocalStatus(status);
  }, [status]);

  useEffect(() => {
    setLocalCompanyId(companyId);
  }, [companyId]);

  const handleApplyFilters = () => {
    onApply(localSearch, localStatus, localCompanyId);
  };

  const handleClear = () => {
    setLocalSearch("");
    setLocalStatus("all");
    setLocalCompanyId("");
    onApply("", "all", "");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleApplyFilters();
  };

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 w-full">
      <div className="w-full sm:w-auto min-w-[280px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Search Salary Head
        </label>
        <Input
          placeholder="Search by title or description..."
          className="w-full"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

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

      {isSuperAdmin && (
        <div className="w-full sm:w-auto min-w-[220px]">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
            Company
          </label>
          <SearchableSelect
            options={companyOptions}
            placeholder="All Companies"
            value={localCompanyId}
            onChange={(val) => setLocalCompanyId(val || "")}
          />
        </div>
      )}

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
