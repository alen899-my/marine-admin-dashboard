"use client";

import { useEffect, useState } from "react";
import { Metrics } from "@/components/dashboard/Metrics";
import SearchableSelect from "@/components/form/SearchableSelect";
import { useSession } from "next-auth/react";

// ✅ ADDED: Type definition for company options
interface CompanyOption {
  value: string;
  label: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  
  const isSuperAdmin = session?.user?.role?.toLowerCase() === "super-admin";

  // Fetch companies list for the Super Admin dropdown
  useEffect(() => {
    if (isSuperAdmin) {
      fetch("/api/companies")
        .then((res) => res.json())
        .then((json) => {
          const formatted = (json.data || []).map((c: any) => ({
            value: c._id,
            label: c.name,
          }));
          // Add an "All Companies" option
          setCompanies([{ value: "", label: "All Companies" }, ...formatted]);
        });
    }
  }, [isSuperAdmin]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">

        {/* ✅ Searchable Select - Only visible for Super Admin */}
        {isSuperAdmin && (
          <div className="w-full md:w-64">
            <SearchableSelect
              options={companies}
              value={selectedCompanyId}
              onChange={(val) => setSelectedCompanyId(val)}
              placeholder="Filter by Company"
            />
          </div>
        )}
      </div>

      {/* ✅ Pass the selectedCompanyId to the Metrics component */}
      <Metrics selectedCompanyId={selectedCompanyId} />
    </div>
  );
}