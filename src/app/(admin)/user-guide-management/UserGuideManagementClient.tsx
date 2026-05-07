"use client";

import ComponentCard from "@/components/common/ComponentCard";
import FilterToggleButton from "@/components/common/FilterToggleButton";
import TableCount from "@/components/common/TableCount";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import AddUserGuideButton from "./AddUserGuideButton";
import UserGuideFilterWrapper from "./UserGuideFilterWrapper";

interface UserGuideManagementClientProps {
  children: ReactNode;
  totalCount: number;
  groups?: { value: string; label: string }[];
}

export default function UserGuideManagementClient({
  children,
  totalCount,
  groups = [],
}: UserGuideManagementClientProps) {
  const router = useRouter();
  const { can, isReady } = useAuthorization();
  const canView = can("userguide.view");
  const canAdd = can("userguide.create");
  const { isFilterVisible, setIsFilterVisible } = useFilterPersistence("user-guide");

  if (!isReady) return null;

  if (!canView) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="font-medium text-gray-500">
          You do not have permission to access User Guide Management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            User Guide Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage the grouped user guide content shown to users.
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
            <AddUserGuideButton
              onSuccess={() => router.refresh()}
              className="w-full justify-center sm:w-auto"
            />
          )}
        </div>
      </div>

      <ComponentCard
        title={
          isFilterVisible ? (
            <UserGuideFilterWrapper groups={groups} />
          ) : null
        }
      >
        <div className="mb-2 flex justify-end me-2">
          <TableCount count={totalCount} label="user guides" />
        </div>
        {children}
      </ComponentCard>
    </div>
  );
}
