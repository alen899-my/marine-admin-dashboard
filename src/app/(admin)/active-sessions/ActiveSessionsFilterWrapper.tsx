"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import ActiveSessionsFilters, { ActiveSessionsFilterValues } from "./ActiveSessionsFilters";

export default function ActiveSessionsFilterWrapper({
  companies,
  isSuperAdmin,
}: {
  companies: any[];
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleApply = useCallback(
    (values: ActiveSessionsFilterValues) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(values).forEach(([key, value]) => {
        if (value && value !== "all") params.set(key, value);
        else params.delete(key);
      });

      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  const handleClear = useCallback(() => {
    router.push(pathname);
  }, [pathname, router]);

  return (
    <ActiveSessionsFilters
      search={searchParams.get("search") || ""}
      companyId={searchParams.get("companyId") || "all"}
      startDate={searchParams.get("startDate") || ""}
      endDate={searchParams.get("endDate") || ""}
      isSuperAdmin={isSuperAdmin}
      companies={companies}
      onApply={handleApply}
      onClear={handleClear}
    />
  );
}
