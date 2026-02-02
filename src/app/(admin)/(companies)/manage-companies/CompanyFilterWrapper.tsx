"use client";

import CompanyFilters from "@/components/Companies/CompanyFilters";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

export default function CompanyFilterWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Get Values from URL
  const urlStatus = searchParams.get("status") || "all";
  const urlSearch = searchParams.get("search") || "";
  const urlStartDate = searchParams.get("startDate") || "";
  const urlEndDate = searchParams.get("endDate") || "";

  // 2. Local State for Search
  const [searchTerm, setSearchTerm] = useState(urlSearch);

  // 3. Robust Update Function
  const updateFilter = useCallback((key: string, value: string) => {
    const currentVal = searchParams.get(key) || "";
    // Gatekeeper: prevent redundant updates
    if (value === currentVal) return;
    if (value === "all" && (currentVal === "" || currentVal === "all")) return;

    const params = new URLSearchParams(searchParams.toString());

    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.set("page", "1"); // Reset page

    const newQuery = params.toString();
    const currentQuery = searchParams.toString();

    if (newQuery !== currentQuery) {
      router.push(`?${newQuery}`);
    }
  }, [searchParams, router]);

  // 4. Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== urlSearch) {
        updateFilter("search", searchTerm);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, urlSearch, updateFilter]);

  // 5. Sync Search Input (Back button support)
  useEffect(() => {
    if (urlSearch !== searchTerm) setSearchTerm(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  return (
    <CompanyFilters
      search={searchTerm}
      setSearch={setSearchTerm}
      
      status={urlStatus}
      setStatus={(val) => updateFilter("status", val)}
      
      startDate={urlStartDate}
      setStartDate={(val) => updateFilter("startDate", val)}
      
      endDate={urlEndDate}
      setEndDate={(val) => updateFilter("endDate", val)}
    />
  );
}