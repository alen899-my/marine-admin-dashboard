"use client";

import UserGuideFilters, { UserGuideFilterData } from "@/components/user-guide/UserGuideFilters";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function UserGuideFilterWrapper({
  groups,
}: {
  groups: { value: string; label: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleApply = useCallback(
    (data: UserGuideFilterData) => {
      const params = new URLSearchParams(searchParams.toString());

      if (data.search) {
        params.set("search", data.search);
      } else {
        params.delete("search");
      }

      if (data.status && data.status !== "all") {
        params.set("status", data.status);
      } else {
        params.delete("status");
      }

      if (data.group && data.group !== "all") {
        params.set("group", data.group);
      } else {
        params.delete("group");
      }

      params.set("page", "1");
      router.push(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  return (
    <UserGuideFilters
      search={searchParams.get("search") || ""}
      status={searchParams.get("status") || "all"}
      group={searchParams.get("group") || ""}
      groups={groups}
      onApply={handleApply}
    />
  );
}
