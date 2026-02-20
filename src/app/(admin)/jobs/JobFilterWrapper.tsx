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
      search={searchParams.get("search") || ""}
      status={searchParams.get("status") || "all"}
      companyId={searchParams.get("companyId") || "all"}
      startDate={searchParams.get("startDate") || ""}
      endDate={searchParams.get("endDate") || ""}
      onApply={handleApply}
      setSearch={() => { }}
      setStatus={() => { }}
      setStartDate={() => { }}
      setEndDate={() => { }}
      setCompanyId={() => { }}
      companies={companies}
      isSuperAdmin={isSuperAdmin}
      searchJob={true}
    />
  );
}