// src/app/(admin)/compliance-expiry/ComplianceExpiryPageClient.tsx
"use client";

import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { ReactNode } from "react";
import ComplianceExpiryFilterWrapper from "./ComplianceExpiryFilterWrapper";

interface ComplianceExpiryPageClientProps {
  children: ReactNode;
  totalCount: number;
  isSuperAdmin: boolean;
  userCompanyId?: string;
  companies: { id: string; name: string }[];
}

export default function ComplianceExpiryPageClient({
  children,
  totalCount,
  isSuperAdmin,
  companies,
}: ComplianceExpiryPageClientProps) {
  const { can, isReady } = useAuthorization();
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("compliance-expiry");

  const canView = can("compilance.view");

  if (!isReady) return null;

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">
          You do not have permission to access Compliance Expiry.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Compliance Expiry Alerts
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor expiring crew documents, certificates, and compliance requirements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <FilterToggleButton
            isVisible={isFilterVisible}
            onToggle={setIsFilterVisible}
          />
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          isFilterVisible ? (
            <ComplianceExpiryFilterWrapper
              companies={companies}
              isSuperAdmin={isSuperAdmin}
            />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="crew" />
        </div>
        {children}
      </ComponentCard>
    </div>
  );
}
