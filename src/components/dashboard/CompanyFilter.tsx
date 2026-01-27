"use client";

import SearchableSelect from "@/components/form/SearchableSelect";
import { useRouter, useSearchParams } from "next/navigation";

interface CompanyOption {
  value: string;
  label: string;
}

export default function CompanyFilter({
  options,
}: {
  options: CompanyOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read from URL, default to empty
  const currentVal = searchParams.get("companyId") || "";

  const handleChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val && val !== "all") {
      params.set("companyId", val);
    } else {
      params.delete("companyId");
    }
    // Update URL without full page refresh (server components will re-run)
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="w-full md:w-64">
      <SearchableSelect
        options={options}
        value={currentVal}
        onChange={handleChange}
        placeholder="Filter by Company"
      />
    </div>
  );
}
