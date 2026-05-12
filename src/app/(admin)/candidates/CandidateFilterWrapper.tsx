"use client";

import CandidateFilters, {
  CandidateFilterData,
} from "@/components/Jobs/CandidateFilters";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function CandidateFilterWrapper({
  companies,
  isSuperAdmin,
  jobs,
}: {
  companies: any[];
  isSuperAdmin: boolean;
  jobs: { value: string; label: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleApply = useCallback(
    (data: CandidateFilterData) => {
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
    <CandidateFilters
      search={searchParams.get("search") || ""}
      status={searchParams.get("status") || "all"}
      companyId={searchParams.get("companyId") || ""}
      jobTitle={searchParams.get("jobTitle") || ""}
      companies={companies}
      jobs={jobs}
      isSuperAdmin={isSuperAdmin}
      onApply={handleApply}
    />
  );
}
