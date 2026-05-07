"use client";

import LeaveTypeFilters, {
  LeaveTypeFilterData,
} from "@/components/leave-type/LeaveTypeFilters";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function LeaveTypeFilterWrapper({
  companies,
  isSuperAdmin,
}: {
  companies: { value: string; label: string }[];
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [localSearch, setLocalSearch] = useState(
    searchParams.get("search") || "",
  );
  const [localStatus, setLocalStatus] = useState(
    searchParams.get("status") || "all",
  );
  const [localCompanyId, setLocalCompanyId] = useState(
    searchParams.get("companyId") || "",
  );

  useEffect(() => {
    setLocalSearch(searchParams.get("search") || "");
    setLocalStatus(searchParams.get("status") || "all");
    setLocalCompanyId(searchParams.get("companyId") || "");
  }, [searchParams]);

  const pushToRouter = useCallback(
    (search: string, status: string, companyId: string) => {
      const params = new URLSearchParams();

      if (search) params.set("search", search);
      if (status && status !== "all") params.set("status", status);
      if (companyId && companyId !== "all") params.set("companyId", companyId);
      params.set("page", "1");

      router.push(`?${params.toString()}`);
    },
    [router],
  );

  const handleApply = useCallback(
    (data: LeaveTypeFilterData) => {
      pushToRouter(data.search, data.status, data.companyId);
    },
    [pushToRouter],
  );

  return (
    <LeaveTypeFilters
      search={localSearch}
      setSearch={setLocalSearch}
      status={localStatus}
      setStatus={setLocalStatus}
      companyId={localCompanyId}
      companies={companies}
      isSuperAdmin={isSuperAdmin}
      onApply={handleApply}
    />
  );
}
