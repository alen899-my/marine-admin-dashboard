"use client";

import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { ReactNode } from "react";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import JobFilterWrapper from "./JobFilterWrapper";
import Button from "@/components/ui/button/Button";

interface JobPageClientProps {
  children: ReactNode;
  totalCount: number;
  companies: { id: string; name: string }[];
  isSuperAdmin: boolean;
  canAdd: boolean;
}

export default function JobPageClient({
  children,
  totalCount,
  companies,
  isSuperAdmin,
  canAdd,
}: JobPageClientProps) {
  const router = useRouter();
  const { can, isReady } = useAuthorization();

  // Aligned to the same permission namespace used in the API routes
  const canView   = can("jobs.view");
  const canCreate = can("jobs.create") || canAdd;

  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("jobs");

  if (!isReady) return null;

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">
          You do not have permission to access Crew Management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Crew Applications
        </h2>
        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="w-full flex justify-end sm:w-auto">
            <FilterToggleButton
              isVisible={isFilterVisible}
              onToggle={setIsFilterVisible}
            />
          </div>
          {canCreate && (
            <div className="w-full sm:w-auto">
              <Button
                onClick={() => router.push("/jobs/apply")}
                variant="primary"
                size="sm"
                className="w-full sm:w-auto justify-center"
                startIcon={<Plus size={18} />}
              >
                New Crew Application
              </Button>
            </div>
          )}
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          isFilterVisible ? (
            <JobFilterWrapper
              companies={companies}
              isSuperAdmin={isSuperAdmin}
            />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="Applications" />
        </div>
        {children}
      </ComponentCard>
    </div>
  );
}
