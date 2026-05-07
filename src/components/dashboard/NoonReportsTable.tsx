"use client";

import React from "react";
import { FileText } from "lucide-react";
import type { NoonReportRow } from "@/lib/services/voyage-ops";

interface NoonReportsTableProps {
  rows: NoonReportRow[];
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCoord(val: string): string {
  return val && val !== "—" ? val : "—";
}

export default function NoonReportsTable({ rows }: NoonReportsTableProps) {
  return (
    <div className="min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/50">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Latest Noon Reports
        </span>
        <span className="shrink-0 pr-12 text-xs text-gray-400 dark:text-gray-500">
          Last {rows.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <FileText className="h-9 w-9 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No noon reports found.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {[
                  "Vessel",
                  "Date",
                  "Position (Lat / Long)",
                  "Dist 24h (nm)",
                  "VLSFO (mt)",
                  "LSMGO (mt)",
                ].map((h) => (
                  <th
                    key={h}
                    className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {rows.map((row) => (
                <tr
                  key={row.reportId}
                  className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3.5 px-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {row.vesselName}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(row.reportDate)}
                  </td>
                  <td className="py-3.5 px-2 text-sm font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {formatCoord(row.lat)} / {formatCoord(row.long)}
                  </td>
                  <td className="py-3.5 px-2 text-sm font-semibold text-gray-800 dark:text-white text-right">
                    {row.distLast24h.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-2 text-sm text-right">
                    <span className="inline-block rounded-md bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                      {row.vlsfo.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-sm text-right">
                    <span className="inline-block rounded-md bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-900/20 dark:text-sky-400">
                      {row.lsmgo.toFixed(2)}
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
