"use client";

import Checkbox, { CheckboxVariant } from "@/components/form/input/Checkbox";
import Tooltip from "@/components/ui/tooltip/Tooltip"; //  Tooltip imported
import { useMemo } from "react";

// Match the permission interface used across your application
interface IPermission {
  _id: string;
  slug: string;
  name: string;
  description?: string;
  group?: string;
  resourceId?: {
    _id: string;
    name: string;
  };
}

interface DashboardWidgetSectionUserProps {
  allPermissions: IPermission[];
  rolePermissions: string[];
  additionalPermissions: string[];
  excludedPermissions: string[];
  onToggle: (slug: string) => void;
  isReadOnly: boolean;
  isSuperAdmin?: boolean;
}

export default function DashboardWidgetSectionUser({
  allPermissions = [],
  rolePermissions,
  additionalPermissions,
  excludedPermissions,
  onToggle,
  isReadOnly,
  isSuperAdmin = false,
}: DashboardWidgetSectionUserProps) {
  // 🟢 Filter Logic: Identify any permission that is NOT a CRUD operation
  const generalPermissions = useMemo(() => {
    const crudEndings = [".create", ".view", ".edit", ".delete"];
    if (!allPermissions || allPermissions.length === 0) return [];

    return allPermissions.filter((p) => {
      // Check if it ends with standard CRUD actions
      const isCrud = crudEndings.some((ending) =>
        p.slug.toLowerCase().endsWith(ending),
      );

      // We exclude CRUD so it falls into this "General" section
      return !isCrud;
    });
  }, [allPermissions]);

  // If no general permissions exist, don't render the section
  if (generalPermissions.length === 0) return null;

  return (
    <div className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <h3 className="text-xs font-bold uppercase text-gray-800 dark:text-white/90 mb-3 tracking-wider">
        General Permissions
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
        {generalPermissions.map((perm) => {
          const isInherited = rolePermissions.includes(perm.slug);
          const isAdditional = additionalPermissions.includes(perm.slug);
          const isExcluded = excludedPermissions.includes(perm.slug);

          let isChecked = false;
          let variant: CheckboxVariant = "default";
          let statusLabel = "";

          if (isSuperAdmin && !isExcluded) {
            isChecked = true;
            variant = "default";
            statusLabel = "Super Admin (implicit)";
          } else if (isExcluded) {
            isChecked = true;
            variant = "danger";
            statusLabel = "Manually Excluded";
          } else if (isInherited) {
            isChecked = true;
            variant = "default";
            statusLabel = "Inherited from Role";
          } else if (isAdditional) {
            isChecked = true;
            variant = "success";
            statusLabel = "Manually Added";
          }

          return (
            /*  Wrapped with Tooltip - Children nested inside */
            <Tooltip
              key={perm._id}
              position="top"
              content={
                <div className="">
                  <p className="text-gray-300 leading-tight">
                    {perm.description ||
                      `Grants the user ${perm.name} capability.`}
                  </p>
                </div>
              }
            >
              <div
                onClick={() => !isReadOnly && onToggle(perm.slug)}
                className={`
                  flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700
                  hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer select-none h-full w-full
                  ${isReadOnly ? "opacity-80 cursor-default pointer-events-none" : ""}
                `}
              >
                <div className="mt-0.5 pointer-events-none">
                  <Checkbox
                    checked={isChecked}
                    onChange={() => {}}
                    variant={variant}
                  />
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {perm.name}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">
                    {perm.description || `Access to ${perm.name}`}
                  </span>
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
