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
  { label: "Daily Noon Stats", slug: "stats.noon", description: "Show Noon Report Count" },
  { label: "Departure Stats", slug: "stats.departure", description: "Show Departure Report Count" },
  { label: "Arrival Stats", slug: "stats.arrival", description: "Show Arrival Report Count" },
  { label: "NOR Stats", slug: "stats.nor", description: "Show NOR Report Count" },
  { label: "Cargo Stowage Stats", slug: "stats.cargo_stowage", description: "Show Cargo Stowage Count" },
  { label: "Cargo Docs Stats", slug: "stats.cargo_docs", description: "Show Cargo Documents Count" },
];

export default function DashboardWidgetSectionUser({ 
  rolePermissions, 
  additionalPermissions, 
  excludedPermissions, 
  onToggle,
  isReadOnly
}: DashboardWidgetSectionUserProps) {

  return (
    <div className="w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-6">
      {/* Header */}
      <div className="grid grid-cols-12 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-gray-700 py-2 px-4">
        <div className="col-span-10 text-xs font-bold uppercase text-gray-600 dark:text-gray-300">
          Dashboard Widget
        </div>
        <div className="col-span-2 text-center text-xs font-bold uppercase text-gray-600 dark:text-gray-300">
          Status
        </div>
      </div>

      {/* Body Rows */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-transparent">
        {WIDGETS.map((widget, index) => {
          const isInherited = rolePermissions.includes(widget.slug);
          const isAdditional = additionalPermissions.includes(widget.slug);
          const isExcluded = excludedPermissions.includes(widget.slug);

          let isChecked = false;
          let variant: CheckboxVariant = "default";
          let tooltip = "Click to Add";
          
          const rowClass = "hover:bg-gray-50 dark:hover:bg-white/[0.02]";

          // Checkbox Variant Logic
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
              className={`grid grid-cols-12 items-center py-3 px-4 transition-colors cursor-pointer select-none group ${rowClass}`}
            >
              {/* Widget Name & Description */}
              <div className="col-span-10 pr-4">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {widget.label}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {widget.description}
                </p>
              </div>

              {/* Checkbox Status - Centered in the last column */}
              <div className="col-span-2 flex justify-center">
                <div 
                  // ✅ FIX: Added 'pointer-events-none' here. 
                  // This forces clicks on the checkbox area to fall through to the parent row div.
                  className={`relative flex items-center justify-center p-1 transition-transform pointer-events-none
                    ${!isReadOnly ? 'active:scale-95' : 'cursor-default opacity-80'}
                  `}
                >
                  <Checkbox 
                    checked={isChecked} 
                    onChange={() => {}} // Controlled by row click
                    variant={variant}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}