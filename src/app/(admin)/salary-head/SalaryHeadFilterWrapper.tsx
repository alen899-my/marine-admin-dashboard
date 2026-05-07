"use client";

import SalaryHeadFilters from "@/components/salary-head/SalaryHeadFilters";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function SalaryHeadFilterWrapper({
  isSuperAdmin = false,
  companyOptions = [],
}: {
  isSuperAdmin?: boolean;
  companyOptions?: { value: string; label: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");
  const [localStatus, setLocalStatus] = useState(searchParams.get("status") || "all");
  const [localCompanyId, setLocalCompanyId] = useState(searchParams.get("companyId") || "");

  useEffect(() => {
    setLocalSearch(searchParams.get("search") || "");
    setLocalStatus(searchParams.get("status") || "all");
    setLocalCompanyId(searchParams.get("companyId") || "");
  }, [searchParams]);

  const pushToRouter = useCallback((search: string, status: string, companyId: string) => {
    const params = new URLSearchParams();

    if (search) params.set("search", search);
    if (status && status !== "all") params.set("status", status);
    if (companyId && companyId !== "all") params.set("companyId", companyId);
    params.set("page", "1");

    router.push(`?${params.toString()}`);
  }, [router]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const currentUrlSearch = searchParams.get("search") || "";

      if (localSearch !== currentUrlSearch) {
        pushToRouter(localSearch, localStatus, localCompanyId);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [localSearch, localStatus, localCompanyId, pushToRouter, searchParams]);

  return (
    <SalaryHeadFilters
      search={localSearch}
      status={localStatus}
      companyId={localCompanyId}
      isSuperAdmin={isSuperAdmin}
      companyOptions={companyOptions}
      onApply={(search, status, companyId) => {
        setLocalSearch(search);
        setLocalStatus(status);
        setLocalCompanyId(companyId);
        pushToRouter(search, status, companyId);
      }}
    />
  );
}
