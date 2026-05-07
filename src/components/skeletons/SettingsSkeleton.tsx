import React from "react";

export default function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded-md" />
          <div className="mt-2 h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded-md opacity-60" />
        </div>
      </div>

      {/* Body with Sidebar */}
      <div className="flex flex-col md:flex-row gap-8 py-4">
        {/* Sidebar Skeleton */}
        <aside className="w-full md:w-64 shrink-0 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-11 w-full bg-gray-200 dark:bg-gray-700 rounded-xl opacity-80" />
          ))}
        </aside>

        {/* Content Area Skeleton */}
        <main className="flex-1 w-full max-w-3xl space-y-8">
          <div className="space-y-4">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-md" />
            
            <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between gap-4 sm:gap-6">
                <div className="min-w-0 flex-1 space-y-3 max-w-2xl">
                  <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded-md" />
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-md opacity-60" />
                    <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-md opacity-60" />
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="h-6 w-11 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
