"use client";

import React from "react";

export default function ExpirySkeleton() {
  return (
    <div className="space-y-6 animate-pulse pb-12">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-5 w-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="h-5 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Count badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.03] p-5"
          >
            <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-7 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-2.5 w-32 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5">
        <div className="mb-4 h-4 w-56 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="space-y-3">
          {/* Header row */}
          <div className="grid grid-cols-5 gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
            {[120, 96, 80, 72, 64].map((w, i) => (
              <div
                key={i}
                className="h-3 bg-gray-100 dark:bg-gray-800 rounded"
                style={{ width: `${w}px` }}
              />
            ))}
          </div>
          {/* Data rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-5 gap-3 py-3 border-b border-gray-50 dark:border-gray-800/50 last:border-0"
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded self-center" />
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded self-center" />
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded self-center" />
              <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded-full self-center" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
