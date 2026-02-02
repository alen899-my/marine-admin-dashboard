"use client";

import ResourceFilters from "@/components/resources/ResourceFilters";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResourceFilterWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Initialize local state
  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");
  const [localStatus, setLocalStatus] = useState(searchParams.get("status") || "all");

  // 2. Sync local state from URL (Handles Back/Forward button)
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    const urlStatus = searchParams.get("status") || "all";
    setLocalSearch(urlSearch);
    setLocalStatus(urlStatus);
  }, [searchParams]);

  // 3. Helper to push changes to Router using LATEST local state
  // This ensures we don't overwrite pending search text when changing status
  const pushToRouter = (search: string, status: string) => {
    const params = new URLSearchParams();
    
    if (search) params.set("search", search);
    if (status && status !== "all") params.set("status", status);
    
    // Always reset to page 1 on filter change
    params.set("page", "1");
    
    router.push(`?${params.toString()}`);
  };

  // 4. Debounce Search Logic (Fixed Timeout)
  useEffect(() => {
    const handler = setTimeout(() => {
      const currentUrlSearch = searchParams.get("search") || "";
      
      // Only push if the local value is different from URL to avoid infinite loops
      if (localSearch !== currentUrlSearch) {
        pushToRouter(localSearch, localStatus);
      }
    }, 500); // ✅ Increased from 50ms to 500ms to fix slowness

    return () => clearTimeout(handler);
  }, [localSearch, localStatus, searchParams]); 

  // 5. Immediate Status Handler
  const handleStatusChange = (val: string) => {
    setLocalStatus(val);
    // ✅ Use 'localSearch' here instead of 'searchParams.get("search")' 
    // to preserve what the user is currently typing
    pushToRouter(localSearch, val);
  };

  return (
    <ResourceFilters
      search={localSearch}
      setSearch={setLocalSearch}
      status={localStatus}
      setStatus={handleStatusChange}
    />
  );
}