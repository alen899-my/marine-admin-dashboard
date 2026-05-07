"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import AddAllowanceDeduction from "./AddAllowanceDeduction";
import AllowanceDeductionFilterWrapper from "./AllowanceDeductionFilterWrapper";

interface AllowanceDeductionPageClientProps {
  children: ReactNode;
  totalCount: number;
  companies?: { value: string; label: string }[];
  isSuperAdmin?: boolean;
}

export default function AllowanceDeductionPageClient({
  children,
  totalCount,
  companies = [],
  isSuperAdmin = false,
}: AllowanceDeductionPageClientProps) {
  const router = useRouter();
  const { can, isReady } = useAuthorization();
  const canView = can("allowance.deduction.view");
  const canAdd = can("allowance.deduction.create");
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence(
    "allowance-deduction",
  );

  if (!isReady) return null;

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">
          You do not have permission to access Allowance & Deduction Management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Allowance & Deduction Management
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Maintain reusable allowance and deduction masters for salary and payroll setup.
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
              <AddAllowanceDeduction
                onSuccess={() => router.refresh()}
                className="w-full justify-center"
                companies={companies}
                isSuperAdmin={isSuperAdmin}
              />
            </div>
          )}
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          isFilterVisible ? (
            <AllowanceDeductionFilterWrapper
              companies={companies}
              isSuperAdmin={isSuperAdmin}
            />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="masters" />
        </div>

        {children}
      </ComponentCard>
    </div>
  );
}
