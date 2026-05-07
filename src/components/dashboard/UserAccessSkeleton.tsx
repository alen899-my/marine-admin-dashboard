"use client";

import React from "react";
import { SkeletonKPI, SkeletonTable } from "./DashboardSkeletons";

export default function UserAccessSkeleton() {
  return (
    <div className="space-y-6 animate-pulse pb-12">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="h-5 w-1 bg-gray-200 dark:bg-gray-800 rounded-full" />
        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <SkeletonKPI />
        <SkeletonKPI />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[300px] rounded-2xl bg-gray-100 dark:bg-gray-800/30" />
        <div className="h-[300px] rounded-2xl bg-gray-100 dark:bg-gray-800/30" />
      </div>

      <SkeletonTable rows={10} title />
    </div>
  );
}
