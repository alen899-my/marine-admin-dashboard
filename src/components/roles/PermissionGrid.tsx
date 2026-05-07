"use client";

import Checkbox, { CheckboxVariant } from "@/components/form/input/Checkbox";
import Tooltip from "@/components/ui/tooltip/Tooltip";
import { useMemo } from "react";
// --- Types ---
export interface IPermission {
  _id: string;
  slug: string;
  name: string;
  description?: string;
  group: string;
  resourceId?: {
    _id: string;
    name: string;
  };
}

interface PermissionGridProps {
  allPermissions: IPermission[];
  selectedPermissions?: string[]; // Array of slugs (used for Roles)
  rolePermissions?: string[]; // (used for Users)
  additionalPermissions?: string[]; // (used for Users)
  excludedPermissions?: string[]; // (used for Users)
  isReadOnly?: boolean;
  onToggle?: (slug: string, checked: boolean) => void;
}

// --- Helper: Group permissions ---
const groupPermissions = (perms: IPermission[]) => {
  return perms.reduce(
    (groups, perm) => {
      const groupName =
        (perm.resourceId as any)?.name || perm.group || "General";

      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(perm);
      return groups;
    },
    {} as Record<string, IPermission[]>,
  );
};

export default function PermissionGrid({
  allPermissions,
  selectedPermissions = [],
  rolePermissions = [],
  additionalPermissions = [],
  excludedPermissions = [],
  isReadOnly = false,
  onToggle,
}: PermissionGridProps) {
  const filteredPermissions = useMemo(() => {
    if (!allPermissions) return [];

    const gridActions = [".create", ".view", ".edit", ".delete"];

    return allPermissions.filter((p) => {
      // 1. Check if the permission belongs to the Grid (ends with CRUD action)
      const isGridAction = gridActions.some(
        (action) =>
          p.slug.toLowerCase().endsWith(action) ||
          p.slug.toLowerCase() === action.replace(".", ""),
      );

      const groupName = (p.resourceId as any)?.name || p.group;
      const isDashboard = groupName === "Dashboard Statistics";

      return isGridAction && !isDashboard;
    });
  }, [allPermissions]);

  // 2. Group the filtered permissions
  const grouped = useMemo(
    () => groupPermissions(filteredPermissions),
    [filteredPermissions],
  );

  const actionColumns = ["create", "view", "edit", "delete"];
  const headerLabels: Record<string, string> = {
    create: "Create",
    view: "Read",
    edit: "Update",
    delete: "Delete",
  };

  if (!allPermissions || allPermissions.length === 0) {
    return (
      <div className="text-sm text-gray-400 italic p-4">
        Loading permissions...
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="min-w-[600px]">
        {/* Header */}
        <div className="grid grid-cols-5 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-gray-700 py-2 px-4">
          <div className="col-span-1 text-xs font-bold uppercase text-gray-600 dark:text-gray-300">
            resources
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
              <div className="col-span-1 font-semibold text-sm text-gray-600 dark:text-gray-200 truncate pr-2">
                {groupName}
              </div>

              {actionColumns.map((action) => {
                // Robust finding logic: Matches "module.create" or just "create"
                const perm = groupPerms.find(
                  (p) =>
                    p.slug.toLowerCase().endsWith(`.${action}`) ||
                    p.slug.toLowerCase() === action,
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

                // --- User Specific Logic ---
                const isInherited = rolePermissions.includes(perm.slug);
                const isAdditional = additionalPermissions.includes(perm.slug);
                const isExcluded = excludedPermissions.includes(perm.slug);

                // --- Effective Check ---
                let isChecked = selectedPermissions.includes(perm.slug);
                let variant: CheckboxVariant = "default";

                if (excludedPermissions.length > 0 || additionalPermissions.length > 0 || rolePermissions.length > 0) {
                  isChecked = (isInherited || isAdditional) && !isExcluded;
                  if (isExcluded) variant = "danger";
                  else if (isAdditional) variant = "success";
                  else if (isInherited) variant = "default";
                }

                return (
                  <div key={action} className="flex justify-center">
                    <Tooltip
                      position="top"
                      content={
                        <div className="space-y-1">
                          <p>
                            {perm.description ||
                              `Allows the user to ${action} ${groupName}.`}
                          </p>
                        </div>
                      }
                    >
                      <div
                        onClick={() =>
                          !isReadOnly && onToggle?.(perm.slug, !isChecked)
                        }
                        className={`relative flex items-center justify-center p-1 transition-transform 
                        ${
                          !isReadOnly
                            ? "cursor-pointer active:scale-95"
                            : "cursor-default pointer-events-none opacity-80"
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onChange={() => {}} // Controlled by div click for better UX
                          variant={variant}
                          className={isReadOnly ? "pointer-events-none" : ""}
                        />
                      </div>
                    </Tooltip>
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
