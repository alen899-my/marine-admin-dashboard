"use client";

import React, { useMemo } from "react";
import Checkbox, { CheckboxVariant } from "@/components/form/input/Checkbox";

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
  allPermissions: IPermission[]; // Added to allow dynamic filtering
  rolePermissions: string[];
  additionalPermissions: string[];
  excludedPermissions: string[];
  onToggle: (slug: string) => void;
  isReadOnly: boolean;
}

export default function DashboardWidgetSectionUser({ 
  allPermissions = [],
  rolePermissions, 
  additionalPermissions, 
  excludedPermissions, 
  onToggle,
  isReadOnly
}: DashboardWidgetSectionUserProps) {

  // 🟢 Filter Logic: Identify any permission that is NOT a CRUD operation
  const generalPermissions = useMemo(() => {
    const crudEndings = [".create", ".view", ".edit", ".delete"];
    
    return allPermissions.filter(p => {
      // Check if it ends with standard CRUD actions
      const isCrud = crudEndings.some(ending => p.slug.toLowerCase().endsWith(ending));
      
      // We exclude CRUD so it falls into this "General" section
      return !isCrud;
    });
  }, [allPermissions]);

  // If no general permissions exist, don't render the section
  if (generalPermissions.length === 0) return null;

  return (
    <div className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <h3 className="text-xs font-bold uppercase text-gray-800 dark:text-gray-200 mb-3 tracking-wider">
        General Permissions
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {generalPermissions.map((perm) => {
          const isInherited = rolePermissions.includes(perm.slug);
          const isAdditional = additionalPermissions.includes(perm.slug);
          const isExcluded = excludedPermissions.includes(perm.slug);

          let isChecked = false;
          let variant: CheckboxVariant = "default";
          let tooltip = "Click to Add";
          
          // Logic for variant colors and inheritance
          if (isExcluded) {
            isChecked = true;
            variant = "danger"; 
            tooltip = "Manually Excluded";
          } 
          else if (isInherited) {
            isChecked = true;
            variant = "default"; 
            tooltip = "Inherited from Role";
          } 
          else if (isAdditional) {
            isChecked = true;
            variant = "success"; 
            tooltip = "Manually Added";
          }

          return (
            <div 
              key={perm._id}
              onClick={() => !isReadOnly && onToggle(perm.slug)}
              title={isReadOnly ? "" : tooltip}
              className={`
                flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800
                hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer select-none
                ${isReadOnly ? 'opacity-80 cursor-default' : ''}
              `}
            >
              <div className="mt-0.5 pointer-events-none">
                <Checkbox 
                  checked={isChecked} 
                  onChange={() => {}} 
                  variant={variant}
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
          );
        })}
      </div>
    </div>
  );
}