"use client";

import React from "react";
import { SkeletonTable } from "./DashboardSkeletons";

export default function SalaryInsightsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse pb-12">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="h-5 w-1 bg-gray-200 dark:bg-gray-800 rounded-full" />
        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800/30" />
        <div className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800/30" />
        <div className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[350px] rounded-2xl bg-gray-100 dark:bg-gray-800/30" />
        <SkeletonTable rows={10} title />
      </div>
    </div>
  );
}
