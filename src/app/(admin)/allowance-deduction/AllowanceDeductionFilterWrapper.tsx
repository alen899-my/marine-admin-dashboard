"use client";

import AllowanceDeductionFilters from "@/components/allowance-deduction/AllowanceDeductionFilters";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface AllowanceDeductionFilterWrapperProps {
  companies: { value: string; label: string }[];
  isSuperAdmin: boolean;
}

export default function AllowanceDeductionFilterWrapper({
  companies,
  isSuperAdmin,
}: AllowanceDeductionFilterWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");
  const [localType, setLocalType] = useState(searchParams.get("type") || "all");
  const [localStatus, setLocalStatus] = useState(
    searchParams.get("status") || "all",
  );
  const [localCompanyId, setLocalCompanyId] = useState(
    searchParams.get("companyId") || "",
  );

  useEffect(() => {
    setLocalSearch(searchParams.get("search") || "");
    setLocalType(searchParams.get("type") || "all");
    setLocalStatus(searchParams.get("status") || "all");
    setLocalCompanyId(searchParams.get("companyId") || "");
  }, [searchParams]);

  const pushToRouter = useCallback(
    (search: string, type: string, status: string, companyId: string) => {
      const params = new URLSearchParams();

      if (search) params.set("search", search);
      if (type && type !== "all") params.set("type", type);
      if (status && status !== "all") params.set("status", status);
      if (companyId) params.set("companyId", companyId);
      params.set("page", "1");

      router.push(`?${params.toString()}`);
    },
    [router],
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      const currentUrlSearch = searchParams.get("search") || "";

      if (localSearch !== currentUrlSearch) {
        pushToRouter(localSearch, localType, localStatus, localCompanyId);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [
    localSearch,
    localType,
    localStatus,
    localCompanyId,
    pushToRouter,
    searchParams,
  ]);

  return (
    <AllowanceDeductionFilters
      search={localSearch}
      type={localType}
      status={localStatus}
      companyId={localCompanyId}
      companies={companies}
      isSuperAdmin={isSuperAdmin}
      onApply={(search, type, status, companyId) => {
        setLocalSearch(search);
        setLocalType(type);
        setLocalStatus(status);
        setLocalCompanyId(companyId);
        pushToRouter(search, type, status, companyId);
      }}
    />
  );
}
