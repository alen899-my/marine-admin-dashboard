"use client";

import UserFilters, { UserFilterValues } from "@/components/Users/UserFilters";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function UserFilterWrapper({
  companies,
  isSuperAdmin,
}: {
  companies: any[];
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Legacy Handler (Kept to satisfy TypeScript props)
  const handleUpdate = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") params.set(key, value);
      else params.delete(key);

      // Reset page on filter change
      if (key !== "page") params.set("page", "1");

      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router],
  );

  // ✅ New Batch Apply Handler (Fixes Filter Race Condition)
  const handleApply = useCallback(
    (values: UserFilterValues) => {
      const params = new URLSearchParams(searchParams.toString());

      // Update all params at once
      Object.entries(values).forEach(([key, value]) => {
        if (value && value !== "all") params.set(key, value);
        else params.delete(key);
      });

      // Always reset to page 1 on new search
      params.set("page", "1");

      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router],
  );

  // ✅ Clear Handler
  const handleClear = useCallback(() => {
    router.push(pathname); // Clear query string completely
  }, [pathname, router]);

  return (
    <UserFilters
      // Pass current URL values as initial state
      search={searchParams.get("search") || ""}
      status={searchParams.get("status") || "all"}
      companyId={searchParams.get("companyId") || "all"}
      startDate={searchParams.get("startDate") || ""}
      endDate={searchParams.get("endDate") || ""}
      // Dummy setters (required by interface but overridden by onApply)
      setSearch={() => {}}
      setStatus={() => {}}
      setCompanyId={() => {}}
      setStartDate={() => {}}
      setEndDate={() => {}}
      // ✅ Real Logic
      isSuperAdmin={isSuperAdmin}
      companies={companies}
      onApply={handleApply}
      onClear={handleClear}
    />
  );
}
