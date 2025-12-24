import React from "react";
import Checkbox from "@/components/form/input/Checkbox";

interface DashboardWidgetSectionProps {
  selectedPermissions: string[];
  onToggle: (slug: string, checked: boolean) => void;
}

// These slugs must match your seed data exactly
const WIDGETS = [
  { label: "Daily Noon Stats", slug: "stats.noon", description: "Show Noon Report Count" },
  { label: "Departure Stats", slug: "stats.departure", description: "Show Departure Report Count" },
  { label: "Arrival Stats", slug: "stats.arrival", description: "Show Arrival Report Count" },
  { label: "NOR Stats", slug: "stats.nor", description: "Show NOR Report Count" },
  { label: "Cargo Stowage Stats", slug: "stats.cargo_stowage", description: "Show Cargo Stowage Count" },
  { label: "Cargo Docs Stats", slug: "stats.cargo_docs", description: "Show Cargo Documents Count" },
];

export default function DashboardWidgetSection({ selectedPermissions, onToggle }: DashboardWidgetSectionProps) {
  return (
    <div className="w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header - Styled exactly like PermissionGrid */}
      <div className="grid grid-cols-12 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-gray-700 py-2 px-4">
        <div className="col-span-10 text-xs font-bold uppercase text-gray-600 dark:text-gray-300">
          Dashboard Widget
        </div>
        <div className="col-span-2 text-center text-xs font-bold uppercase text-gray-600 dark:text-gray-300">
          Visible
        </div>
      </div>

      {/* Body Rows */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-transparent">
        {WIDGETS.map((widget, index) => {
          const isChecked = selectedPermissions.includes(widget.slug);

          return (
            <div 
              key={`${widget.slug}-${index}`}
              onClick={() => onToggle(widget.slug, !isChecked)}
              className="grid grid-cols-12 items-center py-3 px-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
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

              {/* Checkbox - Centered in the last column */}
              <div className="col-span-2 flex justify-center">
                <div 
                  className={`relative flex items-center justify-center p-1 transition-transform active:scale-95`}
                >
                  <Checkbox 
                    checked={isChecked} 
                    onChange={() => {}} // Controlled by parent div click
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