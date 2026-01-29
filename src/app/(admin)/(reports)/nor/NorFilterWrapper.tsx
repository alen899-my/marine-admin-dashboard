"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Filters, { FilterData } from "@/components/common/Filters";
import { useCallback } from "react";

export default function NorFilterWrapper({ 
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

  const handleApply = useCallback((data: FilterData) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(data).forEach(([key, value]) => {
      if (value && value !== "all") params.set(key, value);
      else params.delete(key);
    });
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  return (
    <Filters
      search={searchParams.get("search") || ""}
      status={searchParams.get("status") || "all"}
      startDate={searchParams.get("startDate") || ""}
      endDate={searchParams.get("endDate") || ""}
      vesselId={searchParams.get("vesselId") || ""}
      voyageId={searchParams.get("voyageId") || ""}
      companyId={searchParams.get("companyId") || ""}
      
      onApply={handleApply}
      setSearch={() => {}} setStatus={() => {}} setStartDate={() => {}} setEndDate={() => {}} setVesselId={() => {}} setVoyageId={() => {}} setCompanyId={() => {}}
      
      vessels={vessels}
      companies={companies}
      isSuperAdmin={isSuperAdmin}
      optionOff={false} 
    />
  );
}