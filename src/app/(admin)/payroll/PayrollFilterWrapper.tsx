"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/components/form/input/InputField";
import SearchableSelect from "@/components/form/SearchableSelect";
import Select from "@/components/form/Select";

interface PayrollFilterWrapperProps {
  companies: Array<{ id: string; name: string }>;
  isSuperAdmin: boolean;
  rankOptions: Array<{ value: string; label: string }>;
  vesselOptions: Array<{ value: string; label: string }>;
}

const payrollStatusOptions = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "saved", label: "Saved" },
  { value: "captain_verified", label: "Captain Verified" },
  { value: "finance_approved", label: "Finance Approved" },
];

const payrollPayscaleOptions = [
  { value: "all", label: "All Payscale" },
  { value: "with_payscale", label: "With Payscale" },
  { value: "missing_payscale", label: "Missing Payscale" },
];

const payrollSalaryHeadStateOptions = [
  { value: "all", label: "All Salary Head States" },
  { value: "assigned", label: "Salary Head Assigned" },
  { value: "unassigned", label: "Salary Head Missing" },
];

export default function PayrollFilterWrapper({
  companies,
  isSuperAdmin,
  rankOptions,
  vesselOptions,
}: PayrollFilterWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [companyId, setCompanyId] = useState(searchParams.get("companyId") || "");
  const [rank, setRank] = useState(searchParams.get("rank") || "");
  const [vessel, setVessel] = useState(searchParams.get("vessel") || "");
  const [payscaleStatus, setPayscaleStatus] = useState(
    searchParams.get("payscaleStatus") || "all",
  );
  const [salaryHeadState, setSalaryHeadState] = useState(
    searchParams.get("salaryHeadState") || "all",
  );

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setStatus(searchParams.get("status") || "all");
    setCompanyId(searchParams.get("companyId") || "");
    setRank(searchParams.get("rank") || "");
    setVessel(searchParams.get("vessel") || "");
    setPayscaleStatus(searchParams.get("payscaleStatus") || "all");
    setSalaryHeadState(searchParams.get("salaryHeadState") || "all");
  }, [searchParams]);

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    const previousCompanyId = searchParams.get("companyId") || "";

    if (search.trim()) params.set("search", search.trim());
    else params.delete("search");

    if (status && status !== "all") params.set("status", status);
    else params.delete("status");

    if (companyId) params.set("companyId", companyId);
    else params.delete("companyId");

    if (rank) params.set("rank", rank);
    else params.delete("rank");

    if (vessel) params.set("vessel", vessel);
    else params.delete("vessel");

    if (payscaleStatus && payscaleStatus !== "all") {
      params.set("payscaleStatus", payscaleStatus);
    } else {
      params.delete("payscaleStatus");
    }

    if (salaryHeadState && salaryHeadState !== "all") {
      params.set("salaryHeadState", salaryHeadState);
    } else {
      params.delete("salaryHeadState");
    }

    if (companyId !== previousCompanyId) {
      params.delete("salaryHeadId");
    }

    params.set("page", "1");
    router.push(`?${params.toString()}`);
  }, [
    companyId,
    payscaleStatus,
    rank,
    router,
    salaryHeadState,
    search,
    searchParams,
    status,
    vessel,
  ]);

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("status");
    params.delete("companyId");
    params.delete("rank");
    params.delete("vessel");
    params.delete("payscaleStatus");
    params.delete("salaryHeadState");
    params.delete("salaryHeadId");
    params.delete("page");
    setSearch("");
    setStatus("all");
    setCompanyId("");
    setRank("");
    setVessel("");
    setPayscaleStatus("all");
    setSalaryHeadState("all");
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex w-full flex-wrap items-end gap-4 p-4">
      <div className="min-w-0 w-full sm:w-auto sm:min-w-[280px]">
        <label className="mb-1.5 ml-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
          Search Crew
        </label>
        <Input
          placeholder="Search by crew name, email or rank"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              applyFilters();
            }
          }}
        />
      </div>

      <div className="min-w-0 w-full sm:w-auto sm:min-w-[200px]">
        <label className="mb-1.5 ml-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
          Rank
        </label>
        <SearchableSelect
          options={rankOptions}
          placeholder="All Ranks"
          value={rank}
          onChange={(value) => setRank(value || "")}
        />
      </div>

      <div className="min-w-0 w-full sm:w-auto sm:min-w-[200px]">
        <label className="mb-1.5 ml-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
          Vessel
        </label>
        <SearchableSelect
          options={vesselOptions}
          placeholder="All Vessels"
          value={vessel}
          onChange={(value) => setVessel(value || "")}
        />
      </div>

      <div className="min-w-0 w-full sm:w-auto sm:min-w-[200px]">
        <label className="mb-1.5 ml-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
          Payscale
        </label>
        <Select
          className="w-full"
          value={payscaleStatus}
          onChange={setPayscaleStatus}
          placeholder="Select payscale state"
          options={payrollPayscaleOptions}
        />
      </div>

      <div className="min-w-0 w-full sm:w-auto sm:min-w-[220px]">
        <label className="mb-1.5 ml-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
          Salary Head State
        </label>
        <Select
          className="w-full"
          value={salaryHeadState}
          onChange={setSalaryHeadState}
          placeholder="Select salary head state"
          options={payrollSalaryHeadStateOptions}
        />
      </div>

      <div className="min-w-0 w-full sm:w-auto sm:min-w-[200px]">
        <label className="mb-1.5 ml-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
          Status
        </label>
        <Select
          className="w-full"
          value={status}
          onChange={setStatus}
          placeholder="Select status"
          options={payrollStatusOptions}
        />
      </div>

      {isSuperAdmin ? (
        <div className="min-w-0 w-full sm:w-auto sm:min-w-[220px]">
          <label className="mb-1.5 ml-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
            Company
          </label>
          <SearchableSelect
            options={companies.map((company) => ({
              value: company.id,
              label: company.name,
            }))}
            placeholder="All Companies"
            value={companyId}
            onChange={(value) => setCompanyId(value || "")}
          />
        </div>
      ) : null}

      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
        <button
          onClick={applyFilters}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 whitespace-nowrap"
        >
          Apply Filters
        </button>
        <button
          onClick={clearFilters}
          className="rounded-lg border border-gray-300 px-6 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-white/5 whitespace-nowrap"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
