"use client";

import { useEffect, useState } from "react";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import SearchableSelect from "@/components/form/SearchableSelect";
import DatePicker from "@/components/form/date-picker";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";

export interface ActiveSessionsFilterValues {
  search: string;
  companyId: string;
  startDate: string;
  endDate: string;
}

interface ActiveSessionsFiltersProps {
  search: string;
  companyId: string;
  isSuperAdmin: boolean;
  startDate: string;
  endDate: string;
  companies?: { value: string; label: string }[];
  onApply: (values: ActiveSessionsFilterValues) => void;
  onClear: () => void;
}

export default function ActiveSessionsFilters({
  search,
  companyId,
  isSuperAdmin,
  startDate,
  endDate,
  companies = [],
  onApply,
  onClear,
}: ActiveSessionsFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [localCompanyId, setLocalCompanyId] = useState(companyId);
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);

  // Sync state
  useEffect(() => setLocalSearch(search), [search]);
  useEffect(() => setLocalCompanyId(companyId), [companyId]);
  useEffect(() => setLocalStartDate(startDate), [startDate]);
  useEffect(() => setLocalEndDate(endDate), [endDate]);

  const handleApplyFilters = () => {
    onApply({
      search: localSearch,
      companyId: localCompanyId,
      startDate: localStartDate,
      endDate: localEndDate,
    });
  };

  const handleClear = () => {
    setLocalSearch("");
    setLocalCompanyId("all");
    setLocalStartDate("");
    setLocalEndDate("");
    onClear();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleApplyFilters();
  };

  return (
    <div className="flex flex-wrap lg:flex-wrap items-end gap-4 p-4 w-full">
      {/* SEARCH */}
      <div className="w-full sm:w-auto min-w-[200px] shrink-0">
        <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
          Search Users
        </Label>
        <Input
          placeholder="Search by Name or Email..."
          className="w-full"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {isSuperAdmin && (
        <div className="w-full sm:w-auto min-w-[210px] shrink-0">
          <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
            Company
          </Label>
          <SearchableSelect
            value={localCompanyId}
            onChange={(val) => setLocalCompanyId(val || "all")}
            placeholder="Select Company"
            options={[{ value: "all", label: "All Companies" }, ...companies]}
          />
        </div>
      )}

      {/* DATE FROM */}
      <div className="w-full sm:w-auto min-w-[180px] shrink-0">
        <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
          Login Date From
        </Label>
        <DatePicker
          key={`start-${localStartDate}`}
          id="filter-start-date"
          placeholder="dd/mm/yyyy"
          defaultDate={localStartDate}
          onChange={(_, dateStr) => setLocalStartDate(dateStr)}
        />
      </div>

      {/* DATE TO */}
      <div className="w-full sm:w-auto min-w-[180px] shrink-0">
        <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1 block">
          Login Date To
        </Label>
        <DatePicker
          key={`end-${localEndDate}`}
          id="filter-end-date"
          placeholder="dd/mm/yyyy"
          defaultDate={localEndDate}
          onChange={(_, dateStr) => setLocalEndDate(dateStr)}
        />
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex items-center gap-2 mt-2 sm:mt-0 shrink-0">
        <Button
          onClick={handleApplyFilters}
          className="whitespace-nowrap px-6 py-2.5"
        >
          Search
        </Button>
        <Button
          variant="outline"
          onClick={handleClear}
          className="whitespace-nowrap px-6 py-2.5"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
