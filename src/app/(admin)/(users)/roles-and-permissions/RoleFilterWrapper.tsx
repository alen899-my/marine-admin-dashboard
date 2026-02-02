"use client";

import RoleFilters from "@/components/roles/RoleFilters";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

export default function RoleFilterWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Get Values from URL (Source of Truth)
  const urlStatus = searchParams.get("status") || "all";
  const urlSearch = searchParams.get("search") || "";

  // 2. Local State for Search (Smooth Typing)
  const [searchTerm, setSearchTerm] = useState(urlSearch);

  // 3. Robust Update Function
  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.set("page", "1"); // Always reset page

    const newQuery = params.toString();
    const currentQuery = searchParams.toString();

    // Only push if URL actually changes
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

  // 5. Sync Input on External Navigation
  useEffect(() => {
    if (urlSearch !== searchTerm) setSearchTerm(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  return (
    <RoleFilters
      // Pass URL values for immediate updates
      status={urlStatus}
      search={searchTerm} // Use local state for input
      
      // Handlers
      setSearch={setSearchTerm}
      setStatus={(val) => updateFilter("status", val)}
      
      // Unused props (kept for component compatibility if needed)
      startDate="" setStartDate={() => {}}
      endDate="" setEndDate={() => {}}
      showDateFilters={false}
    />
  );
}