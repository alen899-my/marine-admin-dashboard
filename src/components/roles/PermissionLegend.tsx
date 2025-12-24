import React from "react";

export default function PermissionLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
      {/* Active Permission */}
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 flex items-center justify-center  rounded bg-brand-500">
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <span>Role Permissions</span>
      </div>

      {/* No Permission */}
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-transparent"></div>
        <span>No Permission</span>
      </div>
    </div>
  );
}