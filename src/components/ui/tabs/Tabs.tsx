"use client";

import React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "default" | "pills" | "underline";
  size?: "sm" | "md" | "lg";
  className?: string;
  showBadge?: boolean;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = "default",
  size = "md",
  className = "",
  showBadge = true,
}) => {
  const baseClasses = "flex items-center gap-1";

  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-3.5 py-2 text-sm",
    lg: "px-4 py-2.5 text-base",
  };

  const variantClasses = {
    default: {
      container: "bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700",
      active: "bg-brand-600 text-white shadow-sm",
      inactive: "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700",
    },
    pills: {
      container: "",
      active: "bg-brand-600 text-white",
      inactive: "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700",
    },
    underline: {
      container: "border-b border-gray-200 dark:border-gray-700 gap-0",
      active: "border-b-2 border-brand-500 text-brand-600 dark:text-brand-400 -mb-px",
      inactive: "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
    },
  };

  return (
    <div className={`${variantClasses[variant].container} ${baseClasses} ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`
            inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all duration-200
            ${sizeClasses[size]}
            ${activeTab === tab.id 
              ? variantClasses[variant].active 
              : variantClasses[variant].inactive
            }
          `}
        >
          {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
          <span className="truncate">{tab.label}</span>
          {showBadge && tab.badge !== undefined && (
            <span className={`
              ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full
              ${activeTab === tab.id 
                ? "bg-white/20 text-white" 
                : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              }
            `}>
              {tab.badge}
            </span>
          )}
          {variant === "underline" && activeTab === tab.id && (
            <ChevronDown className="w-3 h-3 ml-0.5" />
          )}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
