"use client";

import React from "react";

export default function ContractTimelineSkeleton() {
  return (
    <div className="space-y-6 animate-pulse pb-12">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-5 w-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="h-5 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>

        <div className="space-y-3">
          {/* Header row */}
          <div className="grid grid-cols-7 gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
            {[80, 56, 80, 80, 80, 120, 72].map((w, i) => (
              <div
                key={i}
                className="h-3 bg-gray-100 dark:bg-gray-800 rounded"
                style={{ maxWidth: `${w}px` }}
              />
            ))}
          </div>

          {/* Data rows */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-7 gap-3 py-3 border-b border-gray-50 dark:border-gray-800/50 last:border-0 items-center"
            >
              {/* Seafarer with avatar */}
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="h-3 w-14 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="h-3 w-7 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
