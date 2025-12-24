import React from "react";
import Checkbox from "@/components/form/input/Checkbox";

interface DashboardTabProps {
  selectedPermissions: string[];
  onToggle: (slug: string, checked: boolean) => void;
}

// Map your Widgets to the specific 'VIEW' permission slug seeded earlier
const DASHBOARD_WIDGETS = [
  { label: "Global Dashboard Access", slug: "dashboard.view", description: "Can access the main dashboard page" },
  { label: "Daily Noon Widget", slug: "noon.view", description: "Visible in metrics cards" },
  { label: "Departure Widget", slug: "departure.view", description: "Visible in metrics cards" },
  { label: "Arrival Widget", slug: "arrival.view", description: "Visible in metrics cards" },
  { label: "NOR Widget", slug: "nor.view", description: "Visible in metrics cards" },
  { label: "Cargo Stowage Widget", slug: "cargo.view", description: "Visible in metrics cards" },
];

export default function DashboardTab({ selectedPermissions, onToggle }: DashboardTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
      {DASHBOARD_WIDGETS.map((widget) => {
        const isChecked = selectedPermissions.includes(widget.slug);

        return (
          <div 
            key={widget.slug}
            onClick={() => onToggle(widget.slug, !isChecked)}
            className={`
              flex items-start gap-3 p-4  transition-all cursor-pointer select-none
              ${isChecked 
                ? "  " 
                : ""}
            `}
          >
            <div className="mt-1">
              <Checkbox 
                checked={isChecked} 
                onChange={() => {}} // Controlled by div click
                variant="default"
              />
            </div>
            <div>
              <h4 className={`text-sm font-semibold ${isChecked ? "text-teal-900 dark:text-teal-100" : "text-gray-700 dark:text-gray-200"}`}>
                {widget.label}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {widget.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}