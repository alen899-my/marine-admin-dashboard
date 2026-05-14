"use client";

import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { ReactNode } from "react";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useRouter } from "next/navigation";
import ContractFilterWrapper from "./ContractFilterWrapper";

interface ContractPageClientProps {
  children: ReactNode;
  data: any[];
  totalCount: number;
  companies: { id: string; name: string }[];
  jobs: { value: string; label: string }[];
  vessels: { value: string; label: string; id: string }[];
  isSuperAdmin: boolean;
  currentCompanyId: string;
  portalCompanyId: string;
  currencySettings?: {
    currencyPosition: "left" | "right";
    currencyFormatType: "symbol" | "code";
    currencySpace: boolean;
  };
}

export default function ContractPageClient({
  children,
  data,
  totalCount,
  companies,
  jobs,
  vessels,
  isSuperAdmin,
  currentCompanyId,
  portalCompanyId,
  currencySettings,
}: ContractPageClientProps) {
  const router = useRouter();
  const { can, isReady } = useAuthorization();
  const canView = can("contracts.view");
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("contracts");

  if (!isReady) return null;

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">
          You do not have permission to access Contracts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Contracts
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage crew contracts, salary history, allowances, deductions, and SEA records.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="w-full flex justify-end sm:w-auto">
            <FilterToggleButton
              isVisible={isFilterVisible}
              onToggle={setIsFilterVisible}
            />
          </div>

          
          {/* New Candidate button removed because Contracts are derived from jobs */}
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          isFilterVisible ? (
            <ContractFilterWrapper
              companies={companies}
              jobs={jobs}
              isSuperAdmin={isSuperAdmin}
            />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="Contracts" />
        </div>
        {children}
      </ComponentCard>
    </div>
  );
}
