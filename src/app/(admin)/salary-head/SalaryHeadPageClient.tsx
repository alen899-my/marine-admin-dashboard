"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import AddSalaryHead from "./AddSalaryHead";
import SalaryHeadFilterWrapper from "./SalaryHeadFilterWrapper";

interface SalaryHeadPageClientProps {
  children: ReactNode;
  totalCount: number;
  currencyCode?: string;
  isSuperAdmin?: boolean;
  companyOptions?: { value: string; label: string }[];
  companyId?: string;
}

export default function SalaryHeadPageClient({
  children,
  totalCount,
  currencyCode = "USD",
  isSuperAdmin = false,
  companyOptions = [],
  companyId = "",
}: SalaryHeadPageClientProps) {
  const router = useRouter();
  const { can, isReady } = useAuthorization();
  const canView = can("salary.head.view");
  const canAdd = can("salary.head.create");
  const { isFilterVisible, setIsFilterVisible } =
    useFilterPersistence("salary-head");

  if (!isReady) return null;

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">
          You do not have permission to access Salary Head Management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Salary Head Management
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure salary heads with allowances and deductions for payroll processing.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="w-full flex justify-end sm:w-auto">
            <FilterToggleButton
              isVisible={isFilterVisible}
              onToggle={setIsFilterVisible}
            />
          </div>

          {canAdd && (
            <div className="w-full sm:w-auto">
              <AddSalaryHead
                onSuccess={() => router.refresh()}
                className="w-full justify-center"
                currencyCode={currencyCode}
                isSuperAdmin={isSuperAdmin}
                companyOptions={companyOptions}
                companyId={companyId}
              />
            </div>
          )}
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={isFilterVisible ? <SalaryHeadFilterWrapper isSuperAdmin={isSuperAdmin} companyOptions={companyOptions} /> : null}
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="salary heads" />
        </div>

        {children}
      </ComponentCard>
    </div>
  );
}
