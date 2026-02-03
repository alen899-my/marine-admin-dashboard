import React from "react";

interface TablePageSkeletonProps {
  /** Number of rows to simulate (default: 5) */
  rowCount?: number;
  /** Number of columns to simulate (default: 6) */
  columnCount?: number;
  /** Show the skeleton for the Filter button? (default: true) */
  hasFilter?: boolean;
  /** Show the skeleton for the Export button? (default: true) */
  hasExport?: boolean;
  /** Show the skeleton for the Add New button? (default: true) */
  hasAdd?: boolean;
  /** If true, renders thicker cells to simulate multi-line data like address/navigation (default: false) */
  isComplex?: boolean;
}

export default function TablePageSkeleton({
  rowCount = 5,
  columnCount = 6,
  hasFilter = true,
  hasExport = true,
  hasAdd = true,
  isComplex = false,
}: TablePageSkeletonProps) {
  return (
    <div className="space-y-6 animate-pulse">
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Page Title */}
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-md" />

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Filter Toggle */}
          {hasFilter && (
            <div className="w-full sm:w-auto flex justify-end">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          )}

          {/* Export Button */}
          {hasExport && (
            <div className="w-full sm:w-auto">
              <div className="h-10 w-full sm:w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          )}

          {/* Add Button */}
          {hasAdd && (
            <div className="w-full sm:w-auto">
              <div className="h-10 w-full sm:w-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          )}
        </div>
      </div>

      {/* --- CARD WRAPPER --- */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900 shadow-sm">
        {/* Card Header (Count label) */}
        <div className="p-4 border-b border-gray-100 dark:border-white/5 flex justify-end">
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-md" />
        </div>

        {/* --- TABLE CONTENT --- */}
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1000px]">
            <table className="w-full">
              {/* Header */}
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                  <th className="px-4 py-3 text-left w-16">
                    <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
                  </th>
                  {[...Array(columnCount)].map((_, i) => (
                    <th key={i} className="px-4 py-3 text-left">
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                    </th>
                  ))}
                  {/* Action Column Header */}
                  <th className="px-4 py-3 text-left w-32">
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {[...Array(rowCount)].map((_, rIndex) => (
                  <tr key={rIndex} className="bg-white dark:bg-transparent">
                    {/* S.No Column */}
                    <td className="px-4 py-4">
                      <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
                    </td>

                    {/* Data Columns */}
                    {[...Array(columnCount)].map((_, cIndex) => (
                      <td key={cIndex} className="px-4 py-4">
                        {isComplex ? (
                          // Complex: 2 lines to simulate dense data (Vessel/Voyage/Nav)
                          <div className="space-y-2">
                            <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                            <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded opacity-60" />
                          </div>
                        ) : (
                          // Simple: 1 line
                          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                        )}
                      </td>
                    ))}

                    {/* Action Column */}
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md" />
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md" />
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-md" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}