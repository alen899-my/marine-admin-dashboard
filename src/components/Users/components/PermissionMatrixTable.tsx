import React from "react";
import Checkbox, { CheckboxVariant } from "@/components/form/input/Checkbox";

interface IPermission {
  _id: string;
  slug: string;
  description?: string;
  group: string;
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
  
  const groupPermissions = (perms: IPermission[]) => {
    return perms.reduce((groups, perm) => {
      const groupName = perm.group || "General";
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(perm);
      return groups;
    }, {} as Record<string, IPermission[]>);
  };

  if (rolePermissions.length === 0) {
    return <div className="text-gray-400 text-sm italic py-2">Select a role to view its permissions.</div>;
  }

  // ✅ CHANGE: Filter out 'Dashboard Statistics' before grouping
  const filteredPermissions = allPermissions.filter(p => p.group !== "Dashboard Statistics");
  
  // Group only the filtered permissions
  const grouped = groupPermissions(filteredPermissions);
  
  const actionColumns = ["create", "view", "edit", "delete"];
  const headerLabels: Record<string, string> = { create: "Create", view: "Read", edit: "Update", delete: "Delete" };

  return (
    <div className="w-full overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg mt-4">
      <div className="min-w-[600px]">
        {/* Header */}
        <div className="grid grid-cols-5 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-gray-700 py-2 px-4">
          <div className="col-span-1 text-xs font-bold uppercase text-gray-600 dark:text-gray-300">Module</div>
          {actionColumns.map((action) => (
            <div key={action} className="text-center text-xs font-bold uppercase text-gray-600 dark:text-gray-300">
              {headerLabels[action]}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {Object.entries(grouped).map(([groupName, groupPerms]) => (
            <div key={groupName} className="grid grid-cols-5 items-center py-2 px-4">
              <div className="col-span-1 font-semibold text-sm text-gray-800 dark:text-gray-200 truncate pr-2">{groupName}</div>

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
                let tooltip = "Click to Add";

                // ✅ NEW PRIORITY ORDER:
                // 1. Excluded (Red) - Highest Priority (Overrides everything)
                if (isExcluded) {
                  isChecked = true;
                  variant = "danger"; 
                  tooltip = "Manually Excluded";
                } 
                // 2. Role (Blue) - Visual Priority over Additional
                else if (isRolePerm) {
                  isChecked = true;
                  variant = "default"; 
                  tooltip = "previous Role";
                } 
                // 3. Additional (Green) - Only if not in Role (or Role hidden)
                else if (isAdditional) {
                  isChecked = true;
                  variant = "success"; 
                  tooltip = "Manually Added";
                }

                return (
                  <div key={action} className="flex justify-center">
                    <div
                      title={isReadOnly ? "" : tooltip}
                      // Disable click event if readOnly
                      onClick={() => !isReadOnly && onToggle(perm.slug)}
                      className={`relative flex items-center justify-center p-1 transition-transform 
                        ${!isReadOnly ? 'cursor-pointer active:scale-95' : 'cursor-default opacity-60'}`}
                    >
                      <Checkbox 
                        checked={isChecked} 
                        onChange={() => {}} // Controlled by div click
                        variant={variant}
                        className={isReadOnly ? "pointer-events-none" : ""} // Ensure input is non-interactive
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