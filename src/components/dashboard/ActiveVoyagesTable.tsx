"use client";

import React from "react";
import { Ship } from "lucide-react";
import type { ActiveVoyageRow } from "@/lib/services/voyage-ops";

interface ActiveVoyagesTableProps {
  rows: ActiveVoyageRow[];
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    completed:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    scheduled:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        map[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

export default function ActiveVoyagesTable({ rows }: ActiveVoyagesTableProps) {
  return (
    <div className="min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/50">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Active Voyages
        </span>
        {rows.length > 0 && (
          <span className="shrink-0 pr-12 text-xs text-gray-400 dark:text-gray-500">
            {rows.length} voyage{rows.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <Ship className="h-9 w-9 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No active voyages at the moment.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {[
                  "Vessel",
                  "Voyage No",
                  "Status",
                  "Load Port → Discharge Port",
                  "ETA",
                  "Last Noon Report",
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
                  key={row.voyageId}
                  className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3.5 px-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 flex-shrink-0 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Ship className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {row.vesselName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-2 text-sm font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {row.voyageNo}
                  </td>
                  <td className="py-3.5 px-2">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="py-3.5 px-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {row.loadPort}
                    </span>
                    <span className="mx-1.5 text-gray-400">→</span>
                    <span>{row.dischargePort}</span>
                  </td>
                  <td className="py-3.5 px-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(row.eta)}
                  </td>
                  <td className="py-3.5 px-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {row.lastNoonDate ? (
                      formatDate(row.lastNoonDate)
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600 italic">
                        None
                      </span>
                    )}
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
