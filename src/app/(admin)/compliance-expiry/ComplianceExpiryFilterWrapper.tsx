// src/app/(admin)/compliance-expiry/ComplianceExpiryFilterWrapper.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import SearchableSelect from "@/components/form/SearchableSelect";

const EXPIRY_TYPES = [
  { value: "all", label: "All Documents" },
  { value: "medical", label: "Medical Cert" },
  { value: "passport", label: "Passport" },
  { value: "coc", label: "CoC" },
  { value: "stcw", label: "STCW" },
  { value: "seaman", label: "CDC/Seaman Book" },
];

const DAYS_OPTIONS = [
  { value: "30", label: "Next 30 days" },
  { value: "60", label: "Next 60 days" },
  { value: "90", label: "Next 90 days" },
  { value: "180", label: "Next 180 days" },
  { value: "365", label: "Next 1 year" },
];

export interface ComplianceExpiryFilterData {
  search: string;
  expiryType: string;
  daysAhead: string;
  companyId: string;
}

interface Props {
  companies: { id: string; name: string }[];
  isSuperAdmin: boolean;
}

export default function ComplianceExpiryFilterWrapper({ companies = [], isSuperAdmin }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");
  const [localExpiryType, setLocalExpiryType] = useState(searchParams.get("expiryType") || "all");
  const [localDaysAhead, setLocalDaysAhead] = useState(searchParams.get("daysAhead") || "90");
  const [localCompanyId, setLocalCompanyId] = useState(searchParams.get("companyId") || "");

  useEffect(() => { setLocalSearch(searchParams.get("search") || ""); }, [searchParams]);
  useEffect(() => { setLocalExpiryType(searchParams.get("expiryType") || "all"); }, [searchParams]);
  useEffect(() => { setLocalDaysAhead(searchParams.get("daysAhead") || "90"); }, [searchParams]);
  useEffect(() => { setLocalCompanyId(searchParams.get("companyId") || ""); }, [searchParams]);

  const handleApply = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (localSearch) params.set("search", localSearch);
    else params.delete("search");
    if (localExpiryType && localExpiryType !== "all") params.set("expiryType", localExpiryType);
    else params.delete("expiryType");
    if (localDaysAhead) params.set("daysAhead", localDaysAhead);
    else params.delete("daysAhead");
    if (localCompanyId) params.set("companyId", localCompanyId);
    else params.delete("companyId");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  }, [router, searchParams, localSearch, localExpiryType, localDaysAhead, localCompanyId]);

  const handleClear = useCallback(() => {
    setLocalSearch("");
    setLocalExpiryType("all");
    setLocalDaysAhead("90");
    setLocalCompanyId("");
    const params = new URLSearchParams();
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  }, [router]);

  const companyOptions = companies.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 w-full">
      {/* SEARCH */}
      <div className="w-full sm:w-auto min-w-[280px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Search Crew
        </label>
        <Input
          placeholder="Search by name, rank..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
        />
      </div>

      {/* EXPIRY TYPE */}
      <div className="w-full sm:w-auto min-w-[200px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Document Type
        </label>
        <Select
          value={localExpiryType}
          onChange={setLocalExpiryType}
          options={EXPIRY_TYPES}
        />
      </div>

      {/* DAYS AHEAD */}
      <div className="w-full sm:w-auto min-w-[160px]">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1 mb-1.5 block">
          Expiring Within
        </label>
        <Select
          value={localDaysAhead}
          onChange={setLocalDaysAhead}
          options={DAYS_OPTIONS}
        />
      </div>

      {/* COMPANY — Super Admin only */}
      {isSuperAdmin && companyOptions.length > 0 && (
        <div className="w-full sm:w-auto min-w-[200px]">
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
