"use client";

import React, { useMemo } from "react";
import Checkbox, { CheckboxVariant } from "@/components/form/input/Checkbox";
import Tooltip from "@/components/ui/tooltip/Tooltip"; // ✅ Import existing Tooltip

interface IPermission {
  _id: string;
  slug: string;
  name?: string; // Added to support tooltip display
  description?: string;
  group: string;
  resourceId?: {
    _id: string;
    name: string;
  };
}

interface PermissionMatrixTableProps {
  allPermissions: IPermission[];
  rolePermissions: string[];
  additionalPermissions: string[];
  excludedPermissions: string[];
  onToggle: (slug: string) => void;
  isReadOnly?: boolean;
}

export default function PermissionMatrixTable({
  allPermissions,
  rolePermissions,
  additionalPermissions,
  excludedPermissions,
  onToggle,
  isReadOnly = false,
}: PermissionMatrixTableProps) {
  
  const grouped = useMemo(() => {
    // 1. Define standard CRUD actions
    const crudEndings = [".create", ".view", ".edit", ".delete"];

    // 2. Filter list to include ONLY CRUD and EXCLUDE Dashboard Stats
    const filtered = allPermissions.filter((p) => {
      const isCrud = crudEndings.some((ending) => p.slug.toLowerCase().endsWith(ending));
      const groupName = p.resourceId?.name || p.group || "";
      return isCrud && groupName !== "Dashboard Statistics";
    });

    // 3. Group the filtered list
    return filtered.reduce((groups, perm) => {
      const groupName = perm.resourceId?.name || perm.group || "General";
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(perm);
      return groups;
    }, {} as Record<string, IPermission[]>);
  }, [allPermissions]);

  if (rolePermissions.length === 0 && additionalPermissions.length === 0 && excludedPermissions.length === 0) {
    return <div className="text-gray-400 text-sm italic py-2">Select a role to view its permissions.</div>;
  }

  const actionColumns = ["create", "view", "edit", "delete"];
  const headerLabels: Record<string, string> = { 
    create: "Create", 
    view: "Read", 
    edit: "Update", 
    delete: "Delete" 
  };

  return (
    <div className="w-full overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg mt-2">
      <div className="min-w-[600px]">
        {/* Header */}
        <div className="grid grid-cols-5 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-gray-700 py-2 px-4">
          <div className="col-span-1 text-xs font-bold uppercase text-gray-600 dark:text-gray-300">resources</div>
          {actionColumns.map((action) => (
            <div key={action} className="text-center text-xs font-bold uppercase text-gray-600 dark:text-gray-300">
              {headerLabels[action]}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {Object.entries(grouped).map(([groupName, groupPerms]) => (
            <div key={groupName} className="grid grid-cols-5 items-center py-2 px-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
              <div className="col-span-1 font-semibold text-sm text-gray-800 dark:text-gray-200 truncate pr-2">
                {groupName}
              </div>

              {actionColumns.map((action) => {
                const perm = groupPerms.find(
                  (p) => p.slug.toLowerCase().endsWith(`.${action}`) || p.slug.toLowerCase() === action
                );

                if (!perm) return <div key={action} className="flex justify-center"><span className="text-gray-300 text-lg">·</span></div>;

                const isRolePerm = rolePermissions.includes(perm.slug);
                const isAdditional = additionalPermissions.includes(perm.slug);
                const isExcluded = excludedPermissions.includes(perm.slug);

                let isChecked = false;
                let variant: CheckboxVariant = "default";
                let statusLabel = "Click to Add";

                if (isExcluded) {
                  isChecked = true;
                  variant = "danger"; 
                  statusLabel = "Manually Excluded";
                } 
                else if (isRolePerm) {
                  isChecked = true;
                  variant = "default"; 
                  statusLabel = "Inherited from Role";
                } 
                else if (isAdditional) {
                  isChecked = true;
                  variant = "success"; 
                  statusLabel = "Manually Added";
                }

                return (
                  <div key={action} className="flex justify-center">
                    {/* ✅ Tooltip implementation */}
                    <Tooltip
                      position="top"
                      content={
                        <div className="">
                         
                          <p className="text-gray-300">
                            {perm.description || `Allows user to ${action} ${groupName}.`}
                          </p>
                        </div>
                      }
                    >
                      <div
                        onClick={() => !isReadOnly && onToggle(perm.slug)}
                        className={`relative flex items-center justify-center p-1 transition-transform 
                          ${!isReadOnly ? 'cursor-pointer active:scale-95' : 'cursor-default opacity-60'}`}
                      >
                        <Checkbox 
                          checked={isChecked} 
                          onChange={() => {}} 
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