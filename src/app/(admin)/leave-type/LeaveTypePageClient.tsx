"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import AddLeaveType from "./AddLeaveType";
import LeaveTypeFilterWrapper from "./LeaveTypeFilterWrapper";

interface LeaveTypePageClientProps {
  children: ReactNode;
  totalCount: number;
  isSuperAdmin: boolean;
  userCompanyId?: string;
  companies: { value: string; label: string }[];
}

export default function LeaveTypePageClient({
  children,
  totalCount,
  isSuperAdmin,
  userCompanyId,
  companies,
}: LeaveTypePageClientProps) {
  const router = useRouter();
  const { can, isReady } = useAuthorization();
  const canView = can("leavetype.view");
  const canAdd = can("leavetype.create");
  const { isFilterVisible, setIsFilterVisible } =
    useFilterPersistence("leave-type");

  if (!isReady) return null;

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 font-medium">
          You do not have permission to access Leave Type Management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Leave Type Management
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Define leave categories used for crew leave tracking and payroll adjustments.
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
              <AddLeaveType
                isSuperAdmin={isSuperAdmin}
                userCompanyId={userCompanyId}
                companies={companies}
                onSuccess={() => router.refresh()}
                className="w-full justify-center"
              />
            </div>
          )}
        </div>
      </div>

      <ComponentCard
        headerClassName="p-0 px-1"
        title={
          isFilterVisible ? (
            <LeaveTypeFilterWrapper
              companies={companies}
              isSuperAdmin={isSuperAdmin}
            />
          ) : null
        }
      >
        <div className="flex justify-end me-2 mb-2">
          <TableCount count={totalCount} label="leave types" />
        </div>

        {children}
      </ComponentCard>
    </div>
  );
}
