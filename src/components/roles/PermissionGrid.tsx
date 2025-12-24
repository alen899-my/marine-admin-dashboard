"use client";

import React, { useMemo } from "react";
import Checkbox, { CheckboxVariant } from "@/components/form/input/Checkbox";

// --- Types ---
export interface IPermission {
  _id: string;
  slug: string;
  description?: string;
  group: string;
}

interface PermissionGridProps {
  allPermissions: IPermission[];
  selectedPermissions: string[]; // Array of slugs
  isReadOnly?: boolean;
  onToggle?: (slug: string, checked: boolean) => void;
}

// --- Helper: Group permissions ---
const groupPermissions = (perms: IPermission[]) => {
  return perms.reduce((groups, perm) => {
    const groupName = perm.group || "General";
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(perm);
    return groups;
  }, {} as Record<string, IPermission[]>);
};

export default function PermissionGrid({
  allPermissions,
  selectedPermissions,
  isReadOnly = false,
  onToggle,
}: PermissionGridProps) {
  
  // 1. Filter out "Dashboard Statistics" so it doesn't show in the grid
  const filteredPermissions = useMemo(() => {
    if (!allPermissions) return [];
    return allPermissions.filter((p) => p.group !== "Dashboard Statistics");
  }, [allPermissions]);

  // 2. Group the filtered permissions
  const grouped = useMemo(() => groupPermissions(filteredPermissions), [filteredPermissions]);
  
  const actionColumns = ["create", "view", "edit", "delete"];
  const headerLabels: Record<string, string> = {
    create: "Create",
    view: "Read",
    edit: "Update",
    delete: "Delete",
  };

  if (!allPermissions || allPermissions.length === 0) {
    return <div className="text-sm text-gray-400 italic p-4">Loading permissions...</div>;
  }

  return (
    <div className="w-full overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="min-w-[600px]">
        {/* Header */}
        <div className="grid grid-cols-5 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-gray-700 py-2 px-4">
          <div className="col-span-1 text-xs font-bold uppercase text-gray-600 dark:text-gray-300">
            Module
          </div>
          {actionColumns.map((action) => (
            <div
              key={action}
              className="text-center text-xs font-bold uppercase text-gray-600 dark:text-gray-300"
            >
              {headerLabels[action]}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {Object.entries(grouped).map(([groupName, groupPerms]) => (
            <div
              key={groupName}
              className="grid grid-cols-5 items-center py-2 px-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="col-span-1 font-semibold text-sm text-gray-800 dark:text-gray-200 truncate pr-2">
                {groupName}
              </div>

              {actionColumns.map((action) => {
                // Robust finding logic: Matches "module.create" or just "create"
                const perm = groupPerms.find(
                  (p) =>
                    p.slug.toLowerCase().endsWith(`.${action}`) ||
                    p.slug.toLowerCase() === action
                );

                if (!perm) {
                  return (
                    <div key={action} className="flex justify-center">
                      <span className="text-gray-300 dark:text-gray-600 text-lg select-none">
                        ·
                      </span>
                    </div>
                  );
                }

                const isAssigned = selectedPermissions.includes(perm.slug);
                const variant: CheckboxVariant = "default";

                return (
                  <div key={action} className="flex justify-center">
                    <div
                      title={isReadOnly ? "" : "Click to toggle"}
                      onClick={() =>
                        !isReadOnly && onToggle?.(perm.slug, !isAssigned)
                      }
                      className={`relative flex items-center justify-center p-1 transition-transform 
                        ${
                          !isReadOnly
                            ? "cursor-pointer active:scale-95"
                            : "cursor-default pointer-events-none opacity-90"
                        }`}
                    >
                      <Checkbox
                        checked={isAssigned}
                        onChange={() => {}} // Controlled by div click for better UX
                        variant={variant}
                        className={isReadOnly ? "pointer-events-none" : ""}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}