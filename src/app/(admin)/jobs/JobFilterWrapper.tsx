"use client";

import CrewFilters, { CrewFilterData } from "@/components/Jobs/Crewfilters";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function CrewFilterWrapper({
  companies,
  isSuperAdmin,
}: {
  companies: any[];
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleApply = useCallback(
    (data: CrewFilterData) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(data).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      params.set("page", "1");
      router.push(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  return (
    <CrewFilters
      search={searchParams.get("search") || ""}
      status={searchParams.get("status") || "all"}
      companyId={searchParams.get("companyId") || ""}
      companies={companies}
      isSuperAdmin={isSuperAdmin}
      onApply={handleApply}
    />
  );
}