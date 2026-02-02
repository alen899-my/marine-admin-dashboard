"use client";

import PermissionFilter from "@/components/permissions/permissionFilter";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface Props {
  modules: { id: string; name: string }[];
}

export default function PermissionFilterWrapper({ modules }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Get Values Directly from URL
  const urlStatus = searchParams.get("status") || "all";
  const urlModule = searchParams.get("module") || "all";
  const urlSearch = searchParams.get("search") || "";

  // 2. Local State for Search (to allow smooth typing)
  const [searchTerm, setSearchTerm] = useState(urlSearch);

  // 3. Robust Update Function (Memoized)
  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Always reset page to 1
    params.set("page", "1");

    const newQuery = params.toString();
    const currentQuery = searchParams.toString();

    if (newQuery !== currentQuery) {
      router.push(`?${newQuery}`);
    }
  }, [searchParams, router]);

  // 4. Debounce Search Logic
  useEffect(() => {
    const handler = setTimeout(() => {
      // Only trigger if local text differs from URL text
      if (searchTerm !== urlSearch) {
        updateFilter("search", searchTerm);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm, urlSearch, updateFilter]);

  // 5. Sync Search Input if URL changes externally (e.g. Back Button)
  useEffect(() => {
     if (urlSearch !== searchTerm) {
        setSearchTerm(urlSearch);
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  return (
    <PermissionFilter
      // Values passed from URL
      status={urlStatus}
      module={urlModule}
      search={searchTerm} // Search uses local state
      
      // Handlers
      setSearch={setSearchTerm}
      setStatus={(val) => updateFilter("status", val)}
      setModule={(val) => updateFilter("module", val)}
      
      modules={modules}
    />
  );
}