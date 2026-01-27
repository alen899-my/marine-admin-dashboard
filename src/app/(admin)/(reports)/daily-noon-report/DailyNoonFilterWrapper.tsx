"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Filters, { FilterData } from "@/components/common/Filters";
import { useCallback } from "react";

export default function DailyNoonFilterWrapper({ 
  vessels, 
  companies, 
  isSuperAdmin 
}: { 
  vessels: any[], 
  companies: any[], 
  isSuperAdmin: boolean 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ New Handler: Updates all params at once
  const handleApply = useCallback((data: FilterData) => {
    const params = new URLSearchParams(searchParams.toString());

    // Loop through all filter keys
    Object.entries(data).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Always reset to page 1 when filtering
    params.set("page", "1");

    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  return (
    <Filters
      // Read values from URL
      search={searchParams.get("search") || ""}
      status={searchParams.get("status") || "all"}
      startDate={searchParams.get("startDate") || ""}
      endDate={searchParams.get("endDate") || ""}
      vesselId={searchParams.get("vesselId") || ""}
      voyageId={searchParams.get("voyageId") || ""}
      companyId={searchParams.get("companyId") || ""}
      
      // ✅ Pass the Batch Apply Handler
      onApply={handleApply}

      // Pass empty functions for legacy setters (Required by TS interface but unused when onApply is present)
      setSearch={() => {}}
      setStatus={() => {}}
      setStartDate={() => {}}
      setEndDate={() => {}}
      setVesselId={() => {}}
      setVoyageId={() => {}}
      setCompanyId={() => {}}
      
      // Data Props
      vessels={vessels}
      companies={companies}
      isSuperAdmin={isSuperAdmin}
      
      // Toggles
      optionOff={false} 
    />
  );
}