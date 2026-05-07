"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import PreArrivalFilters, { PreArrivalFilterData } from "./Prearrivalfilters";

interface PreArrivalFilterWrapperProps {
  vessels: { _id: string; name: string; company?: string }[];
  companies: { _id: string; name: string }[];
  isSuperAdmin: boolean;
}

export default function PreArrivalFilterWrapper({
  vessels,
  companies,
  isSuperAdmin,
}: PreArrivalFilterWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read current URL values to pass as initial state into the filter UI
  const urlSearch = searchParams.get("search") || "";
  const urlStatus = searchParams.get("status") || "all";
  const urlCompanyId = searchParams.get("companyId") || "";
  const urlVesselId = searchParams.get("vesselId") || "";

  // Batch-apply all filters at once (called on Search button click or Reset)
  const handleApply = useCallback(
    (data: PreArrivalFilterData) => {
      const params = new URLSearchParams();

      // Only set params that have meaningful values
      if (data.search) params.set("search", data.search);
      if (data.status && data.status !== "all") params.set("status", data.status);
      if (data.companyId) params.set("companyId", data.companyId);
      if (data.vesselId) params.set("vesselId", data.vesselId);

      // Always reset to page 1 when filters change
      params.set("page", "1");

      router.push(`?${params.toString()}`);
    },
    [router]
  );

  return (
    <PreArrivalFilters
      search={urlSearch}
      status={urlStatus}
      companyId={urlCompanyId}
      vesselId={urlVesselId}
      companies={companies}
      vessels={vessels}
      isSuperAdmin={isSuperAdmin}
      onApply={handleApply}
    />
  );
}