"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { AllowanceDeductionCounts } from "@/lib/services/salary-insights";

interface CatalogCountBadgesProps {
  counts: AllowanceDeductionCounts;
}

export default function CatalogCountBadges({ counts }: CatalogCountBadgesProps) {
  const total = counts.allowances + counts.deductions;

  return (
    <div className="min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg dark:border-gray-800 dark:bg-white/[0.03]">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-5 block">
        Allowance / Deduction Catalog
      </span>

      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Allowances */}
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/60 dark:bg-black/20 text-emerald-500">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 leading-none">
              {counts.allowances}
            </p>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-500 mt-1">
              Allowances
            </p>
          </div>
        </div>

        {/* Deductions */}
        <div className="flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/60 dark:bg-black/20 text-red-500">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 leading-none">
              {counts.deductions}
            </p>
            <p className="text-xs font-semibold text-red-700 dark:text-red-500 mt-1">
              Deductions
            </p>
          </div>
        </div>
      </div>

      {/* Total bar */}
      {total > 0 && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1.5">
            <span>Allowances</span>
            <span>Total: {total}</span>
            <span>Deductions</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{ width: `${(counts.allowances / total) * 100}%` }}
            />
            <div
              className="bg-red-500 transition-all duration-500"
              style={{ width: `${(counts.deductions / total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
