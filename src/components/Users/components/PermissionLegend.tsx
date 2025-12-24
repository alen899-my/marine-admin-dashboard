import React from "react";

interface PermissionLegendProps {
  showAll?: boolean; 
}

export default function PermissionLegend({ showAll = true }: PermissionLegendProps) {
  return (
    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-gray-600 dark:text-gray-400 font-medium">
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 flex items-center justify-center border border-gray-300 rounded bg-brand-600 border-brand-600">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span>Role Permissions</span>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-transparent"></div>
        <span>No Permission</span>
      </div>

      {showAll && (
        <>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 flex items-center justify-center bg-green-600 text-white rounded border border-green-600">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span>Special Permissions</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 flex items-center justify-center bg-red-600 text-white rounded border border-red-600">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span>Removed Permissions</span>
          </div>
        </>
      )}
    </div>
  );
}