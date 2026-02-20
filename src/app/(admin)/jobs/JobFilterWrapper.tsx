"use client";

import Filters, { FilterData } from "@/components/common/Filters";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function JobFilterWrapper({
  companies,
  isSuperAdmin,
}: {
  companies: any[];
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleApply = useCallback(
    (data: FilterData) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(data).forEach(([key, value]) => {
        // Remove "all" or empty values to keep the URL clean
        if (value && value !== "all") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      // Always reset to page 1 on new filter application
      params.set("page", "1");
      router.push(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  return (
    <Filters
      // Current values from URL
      search={searchParams.get("search") || ""}
      status={searchParams.get("status") || "all"}
      companyId={searchParams.get("companyId") || "all"}
      startDate={searchParams.get("startDate") || ""}
      endDate={searchParams.get("endDate") || ""}
      
      // Event Handlers
      onApply={handleApply}
      
      // Standard filter props
      companies={companies}
      isSuperAdmin={isSuperAdmin}
      
      // Configuration for "Jobs/Crew" context
      searchPlaceholder="Search by name, email or rank..."
      optionOff={true} // Usually hides advanced vessel-specific toggles
      
      /* Note: If your Filters component supports custom fields, 
         you can pass nationality or rank specific toggles here.
         Otherwise, the 'search' parameter handles the text queries
         processed by your $text search in the server action.
      */
    />
  );
}