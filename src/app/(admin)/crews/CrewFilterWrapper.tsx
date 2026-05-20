"use client";

import CrewFilters, {
  CrewFilterData,
} from "@/components/Crews/CrewFilters";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function CrewFilterWrapper({
  companies,
  isSuperAdmin,
  jobs,
}: {
  companies: { id?: string; _id?: string; name: string }[];
  isSuperAdmin: boolean;
  jobs: { value: string; label: string }[];
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
      companyId={searchParams.get("companyId") || ""}
      jobTitle={searchParams.get("jobTitle") || ""}
      crewStatus={searchParams.get("crewStatus") || ""}
      companies={companies}
      jobs={jobs}
      isSuperAdmin={isSuperAdmin}
      onApply={handleApply}
    />
  );
}
