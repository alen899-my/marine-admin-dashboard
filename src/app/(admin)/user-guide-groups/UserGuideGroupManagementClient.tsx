"use client";

import ComponentCard from "@/components/common/ComponentCard";
import TableCount from "@/components/common/TableCount";
import { useAuthorization } from "@/hooks/useAuthorization";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import AddUserGuideGroupButton from "./AddUserGuideGroupButton";

interface Props {
  children: ReactNode;
  totalCount: number;
}

export default function UserGuideGroupManagementClient({
  children,
  totalCount,
}: Props) {
  const router = useRouter();
  const { can, isReady } = useAuthorization();

  if (!isReady) return null;
  if (!can("userguide.view")) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="font-medium text-gray-500">
          You do not have permission to access User Guide Groups.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            User Guide Groups
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage the parent groups used by user guide items.
          </p>
        </div>
        <AddUserGuideGroupButton
          onSuccess={() => router.refresh()}
          className="w-full justify-center sm:w-auto"
        />
      </div>

      <ComponentCard>
        <div className="mb-2 flex justify-end me-2">
          <TableCount count={totalCount} label="groups" />
        </div>
        {children}
      </ComponentCard>
    </div>
  );
}
