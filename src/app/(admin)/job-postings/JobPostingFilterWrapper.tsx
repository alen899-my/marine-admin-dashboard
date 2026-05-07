"use client";

import JobPostingFilters, { JobPostingFilterData } from "@/components/Jobs/JobPostingFilters";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function JobPostingFilterWrapper({
  companies,
  isSuperAdmin,
}: {
  companies: { value: string; label: string }[];
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleApply = useCallback(
    (data: JobPostingFilterData) => {
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
    <JobPostingFilters
      search={searchParams.get("search") || ""}
      isAccepting={searchParams.get("isAccepting") || "all"}
      companyId={searchParams.get("companyId") || ""}
      companies={companies}
      isSuperAdmin={isSuperAdmin}
      onApply={handleApply}
    />
  );
}