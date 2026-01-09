"use client";

import React, { useMemo } from "react";
import Checkbox from "@/components/form/input/Checkbox";
import Tooltip from "@/components/ui/tooltip/Tooltip";
// Define the shape of the permission object
export interface IPermission {
  _id: string;
  slug: string;
  name: string;
  description?: string;
  group?: string;
  resourceId?: {
    name: string;
  } | string;
}

interface GeneralPermissionsSectionProps {
  allPermissions: IPermission[];
  selectedPermissions: string[];
  onToggle: (slug: string, checked: boolean) => void;
}

export default function GeneralPermissionsSection({ 
  allPermissions = [], 
  selectedPermissions, 
  onToggle 
}: GeneralPermissionsSectionProps) {

  // 🟢 Change: Filter out CRUD slugs (.create, .view, .edit, .delete)
  const generalPermissions = useMemo(() => {
    const crudEndings = [".create", ".view", ".edit", ".delete"];
    
    return allPermissions.filter(p => {
      // Check if the slug ends with any CRUD action
      const isCrud = crudEndings.some(ending => p.slug.toLowerCase().endsWith(ending));
      // Return true if it is NOT a CRUD action
      return !isCrud;
    });
  }, [allPermissions]);

  // Hide the section if no general permissions are found
  if (generalPermissions.length === 0) return null;
return (
    <div className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <h3 className="text-xs font-bold uppercase text-gray-800 dark:text-gray-200 mb-3 tracking-wider">
        General Permissions
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {generalPermissions.map((perm) => {
          const isChecked = selectedPermissions.includes(perm.slug);

          return (
            /* ✅ Wrapped with Tooltip */
            <Tooltip
              key={perm._id}
              position="top"
              content={
                <div >
               
                  <p>
                    {perm.description || `Grants the user ${perm.name} capability.`}
                  </p>
                </div>
              }
            >
              <div 
                onClick={() => onToggle(perm.slug, !isChecked)}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer select-none h-full"
              >
                <div className="mt-0.5 pointer-events-none">
                  <Checkbox 
                    checked={isChecked} 
                    onChange={() => {}} 
                  />
                </div>

                <div className="flex flex-col">
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