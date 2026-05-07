"use client";

import { useMemo } from "react";
import Checkbox, { CheckboxVariant } from "@/components/form/input/Checkbox";
import Tooltip from "@/components/ui/tooltip/Tooltip";
import RoleComponentCard from "./RoleComponentCard";

// Define the shape of the permission object
export interface IPermission {
  _id: string;
  slug: string;
  name: string;
  description?: string;
  group?: string;
  resourceId?:
    | {
        name: string;
      }
    | string;
}

interface GeneralPermissionsSectionProps {
  allPermissions: IPermission[];
  selectedPermissions?: string[];
  rolePermissions?: string[]; // (used for Users)
  additionalPermissions?: string[]; // (used for Users)
  excludedPermissions?: string[]; // (used for Users)
  onToggle: (slug: string, checked: boolean) => void;
  isReadOnly?: boolean;
  isSuperAdmin?: boolean; //  NEW
}

export default function GeneralPermissionsSection({
  allPermissions = [],
  selectedPermissions = [],
  rolePermissions = [],
  additionalPermissions = [],
  excludedPermissions = [],
  onToggle,
  isReadOnly = false,
  isSuperAdmin = false,
}: GeneralPermissionsSectionProps) {
  // 🟢 Group permissions by resource
  const groupedPermissions = useMemo(() => {
    const crudEndings = [".create", ".view", ".edit", ".delete"];

    const generalOnly = allPermissions.filter((p) => {
      const isCrud = crudEndings.some((ending) =>
        p.slug.toLowerCase().endsWith(ending),
      );
      return !isCrud;
    });

    return generalOnly.reduce((groups, perm) => {
      const resourceName =
        (typeof perm.resourceId === "object"
          ? perm.resourceId?.name
          : perm.resourceId) ||
        perm.group ||
        "General";

      if (!groups[resourceName]) groups[resourceName] = [];
      groups[resourceName].push(perm);
      return groups;
    }, {} as Record<string, IPermission[]>);
  }, [allPermissions]);

  if (Object.keys(groupedPermissions).length === 0) return null;

  return (
    <div className="w-full space-y-6">
      {Object.entries(groupedPermissions).map(([resourceName, permissions]) => (
        <div key={resourceName} className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
            {resourceName}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {permissions.map((perm) => {
              // --- User Specific Logic ---
              const isInherited = rolePermissions.includes(perm.slug);
              const isAdditional = additionalPermissions.includes(perm.slug);
              const isExcluded = excludedPermissions.includes(perm.slug);

              // --- Effective Check ---
              let isChecked =
                isSuperAdmin || selectedPermissions.includes(perm.slug);
              let variant: CheckboxVariant = "default";

              if (
                !isSuperAdmin &&
                (excludedPermissions.length > 0 ||
                  additionalPermissions.length > 0 ||
                  rolePermissions.length > 0)
              ) {
                isChecked = (isInherited || isAdditional) && !isExcluded;
                if (isExcluded) variant = "danger";
                else if (isAdditional) variant = "success";
                else if (isInherited) variant = "default";
              }

              return (
                <Tooltip
                  key={perm._id}
                  position="top"
                  content={
                    <div className="max-w-xs">
                      <p className="text-xs">
                        {perm.description ||
                          `Grants the user ${perm.name} capability.`}
                      </p>
                    </div>
                  }
                >
                  <div
                    onClick={() =>
                      !isReadOnly && onToggle(perm.slug, !isChecked)
                    }
                    className={`group flex items-start gap-3 p-3.5 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 w-full ${
                      isReadOnly
                        ? "cursor-default opacity-80"
                        : "cursor-pointer hover:border-teal-500/30 hover:bg-teal-50/30 dark:hover:bg-teal-500/5 hover:shadow-md"
                    } ${
                      isChecked
                        ? variant === "danger"
                          ? "bg-red-50/20 border-red-500/20 dark:bg-red-500/[0.03]"
                          : variant === "success"
                            ? "bg-green-50/20 border-green-500/20 dark:bg-green-500/[0.03]"
                            : "bg-teal-50/20 border-teal-500/20 dark:bg-teal-500/[0.03]"
                        : "bg-transparent"
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      <Checkbox
                        checked={isChecked}
                        onChange={() => {}}
                        variant={variant}
                      />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span
                        className={`text-sm font-bold transition-colors ${
                          isChecked
                            ? variant === "danger"
                              ? "text-red-700 dark:text-red-400"
                              : variant === "success"
                                ? "text-green-700 dark:text-green-400"
                                : "text-teal-700 dark:text-teal-400"
                            : "text-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {perm.name}
                      </span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5 group-hover:line-clamp-none transition-all">
                        {perm.description || `Access to ${perm.name}`}
                      </span>
                    </div>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
