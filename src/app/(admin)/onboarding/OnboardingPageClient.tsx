"use client";

import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { ReactNode } from "react";
import { useAuthorization } from "@/hooks/useAuthorization";
import OnboardingFilterWrapper from "./OnboardingFilterWrapper";

interface OnboardingPageClientProps {
  children: ReactNode;
  data: any[];
  totalCount: number;
  companies: { id: string; name: string }[];
  jobs: { value: string; label: string }[];
  isSuperAdmin: boolean;
  currentCompanyId: string;
  portalCompanyId: string;
}

export default function OnboardingPageClient({
  children,
  data,
  totalCount,
  companies,
  jobs,
  isSuperAdmin,
  currentCompanyId,
  portalCompanyId,
}: OnboardingPageClientProps) {
  const { can, isReady } = useAuthorization();
  const canView = can("onboarding.view");
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("onboarding");

  if (!isReady) return null;

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">
          You do not have permission to access Onboarding.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Onboarding
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track selected candidates as they move through onboarding and readiness checks.
          </p>
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="w-full flex justify-end sm:w-auto">
            <FilterToggleButton
              isVisible={isFilterVisible}
              onToggle={setIsFilterVisible}
            />
          </div>
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          isFilterVisible ? (
            <OnboardingFilterWrapper
              companies={companies}
              jobs={jobs}
              isSuperAdmin={isSuperAdmin}
            />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="Candidates" />
        </div>
        {children}
      </ComponentCard>
    </div>
  );
}
