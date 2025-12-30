import React from "react";
import Checkbox, { CheckboxVariant } from "@/components/form/input/Checkbox";

interface DashboardWidgetSectionUserProps {
  rolePermissions: string[];
  additionalPermissions: string[];
  excludedPermissions: string[];
  onToggle: (slug: string) => void;
  isReadOnly: boolean;
}

// Ensure these match your seed data exactly
const WIDGETS = [
  { label: "Daily Noon Stats", slug: "stats.noon", description: "Noon Report Count" },
  { label: "Departure Stats", slug: "stats.departure", description: "Departure Report Count" },
  { label: "Arrival Stats", slug: "stats.arrival", description: "Arrival Report Count" },
  { label: "NOR Stats", slug: "stats.nor", description: "NOR Report Count" },
  { label: "Cargo Stowage Stats", slug: "stats.cargo_stowage", description: "Cargo Stowage Count" },
  { label: "Cargo Docs Stats", slug: "stats.cargo_docs", description: "Cargo Documents Count" },
];

export default function DashboardWidgetSectionUser({ 
  rolePermissions, 
  additionalPermissions, 
  excludedPermissions, 
  onToggle,
  isReadOnly
}: DashboardWidgetSectionUserProps) {

  return (
    <div className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <h3 className="text-xs font-bold uppercase text-gray-800 dark:text-gray-200 mb-3 tracking-wider">
        General Permissions
      </h3>

      {/* CHANGED: Using Grid to make rows less (2 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {WIDGETS.map((widget, index) => {
          const isInherited = rolePermissions.includes(widget.slug);
          const isAdditional = additionalPermissions.includes(widget.slug);
          const isExcluded = excludedPermissions.includes(widget.slug);

          let isChecked = false;
          let variant: CheckboxVariant = "default";
          let tooltip = "Click to Add";
          
          // Logic remains exactly the same
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
              key={`${widget.slug}-${index}`}
              onClick={() => !isReadOnly && onToggle(widget.slug)}
              title={isReadOnly ? "" : tooltip}
              className={`
                flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800
                hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer select-none
                ${isReadOnly ? 'opacity-80 cursor-default' : ''}
              `}
            >
              {/* Checkbox Wrapper - pointer-events-none ensures click hits the div */}
              <div className="mt-0.5 pointer-events-none">
                <Checkbox 
                  checked={isChecked} 
                  onChange={() => {}} 
                  variant={variant}
                />
              </div>

              {/* Label & Description */}
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {widget.label}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {widget.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}