"use client";

import { useEffect, useState } from "react";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import SearchableSelect from "@/components/form/SearchableSelect";

export interface PreArrivalFilterData {
  search: string;
  status: string;
  companyId: string;
  vesselId: string;
}

interface PreArrivalFiltersProps {
  search: string;
  status: string;
  companyId?: string;
  vesselId?: string;
  companies?: { _id: string; name: string }[];
  vessels?: { _id: string; name: string; company?: string }[];
  isSuperAdmin?: boolean;
  onApply: (data: PreArrivalFilterData) => void;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "sent", label: "Sent to Agent" },
  { value: "completed", label: "Completed" },
];

export default function PreArrivalFilters({
  search,
  status,
  companyId = "",
  vesselId = "",
  companies = [],
  vessels = [],
  isSuperAdmin = false,
  onApply,
}: PreArrivalFiltersProps) {
  // Local state — only committed to URL on Submit
  const [localSearch, setLocalSearch] = useState(search);
  const [localStatus, setLocalStatus] = useState(status);
  const [localCompanyId, setLocalCompanyId] = useState(companyId);
  const [localVesselId, setLocalVesselId] = useState(vesselId);

  // Sync local state when URL-driven props change (back/forward nav)
  useEffect(() => { setLocalSearch(search); }, [search]);
  useEffect(() => { setLocalStatus(status); }, [status]);
  useEffect(() => { setLocalCompanyId(companyId); }, [companyId]);
  useEffect(() => { setLocalVesselId(vesselId); }, [vesselId]);

  // Filter vessels by selected company for super-admin
  const filteredVessels =
    isSuperAdmin && localCompanyId && localCompanyId !== "all"
      ? vessels.filter((v) => v.company?.toString() === localCompanyId)
      : vessels;

  const vesselOptions = filteredVessels.map((v) => ({
    value: v._id,
    label: v.name,
  }));

  const companyOptions = companies.map((c) => ({
    value: c._id,
    label: c.name,
  }));

  const handleApply = () => {
    onApply({
      search: localSearch,
      status: localStatus,
      companyId: localCompanyId,
      vesselId: localVesselId,
    });
  };

  const handleClear = () => {
    setLocalSearch("");
    setLocalStatus("all");
    setLocalCompanyId("");
    setLocalVesselId("");
    onApply({ search: "", status: "all", companyId: "", vesselId: "" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleApply();
  };

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 w-full">

      {/* Search */}
      <div className="w-full sm:w-auto min-w-[280px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Search
        </label>
        <Input
          placeholder="Search by port name or request ID..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Status */}
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

      {/* Company — Super Admin only */}
      {isSuperAdmin && companies.length > 0 && (
        <div className="w-full sm:w-auto min-w-[200px]">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
            Company
          </label>
          <SearchableSelect
            options={companyOptions}
            placeholder="All Companies"
            value={localCompanyId}
            onChange={(val) => {
              setLocalCompanyId(val || "");
              setLocalVesselId(""); // reset vessel on company change
            }}
          />
        </div>
      )}

      {/* Vessel */}
      <div className="w-full sm:w-auto min-w-[200px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Vessel
        </label>
        <SearchableSelect
          options={vesselOptions}
          placeholder="All Vessels"
          value={localVesselId}
          onChange={(val) => setLocalVesselId(val || "")}
        />
      </div>

      {/* Action Buttons */}
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