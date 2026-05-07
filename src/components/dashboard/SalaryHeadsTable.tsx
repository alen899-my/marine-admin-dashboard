"use client";

import React from "react";
import { BookOpen } from "lucide-react";
import type { SalaryHeadRow } from "@/lib/services/salary-insights";
import { formatCurrency } from "@/lib/formatCurrency";

interface CurrencySettings {
  currencySymbol: string;
  currencyCode: string;
  currencyPosition: "left" | "right";
  currencyFormatType: "symbol" | "code";
  currencySpace: boolean;
}

interface SalaryHeadsTableProps {
  rows: SalaryHeadRow[];
  currencySettings?: CurrencySettings;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const defaultCurrencySettings: CurrencySettings = {
  currencySymbol: "$",
  currencyCode: "USD",
  currencyPosition: "left",
  currencyFormatType: "symbol",
  currencySpace: true,
};

function formatHeadValue(
  total: number,
  entries: { type: "amount" | "percent" }[],
  currencyCode: string,
  currencySettings: CurrencySettings
): string {
  if (entries.length === 0) return formatCurrency(total, currencyCode, { currencySettings });

  // If ALL entries are percentages, show as %
  const allPercent = entries.every((e) => e.type === "percent");
  if (allPercent) {
    return `${total.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}%`;
  }

  // Otherwise show as currency
  return formatCurrency(total, currencyCode, { currencySettings });
}

export default function SalaryHeadsTable({ rows, currencySettings = defaultCurrencySettings }: SalaryHeadsTableProps) {
  return (
    <div className="min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/50">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Active Salary Heads
        </span>
        {rows.length > 0 && (
          <span className="shrink-0 pr-12 text-xs text-gray-400 dark:text-gray-500">
            {rows.length} head{rows.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <BookOpen className="h-9 w-9 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No active salary heads found.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {["Title", "Period From", "Period To", "Total Allowance", "Total Deductions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3.5 px-2 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {row.title}
                  </td>
                  <td className="py-3.5 px-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(row.periodFrom)}
                  </td>
                  <td className="py-3.5 px-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(row.periodTo)}
                  </td>
                  <td className="py-3.5 px-2 text-right whitespace-nowrap">
                    <span className="inline-block rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                      +{formatHeadValue(row.totalAllowance, row.allowanceEntries, currencySettings.currencyCode, currencySettings)}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-right whitespace-nowrap">
                    <span className="inline-block rounded-md bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-400">
                      −{formatHeadValue(row.totalDeductions, row.deductionEntries, currencySettings.currencyCode, currencySettings)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
