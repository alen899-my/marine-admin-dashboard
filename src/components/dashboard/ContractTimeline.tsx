"use client";

import React from "react";
import { FileSignature } from "lucide-react";
import Avatar from "@/components/ui/avatar/Avatar";
import type { ContractTimelineRow } from "@/lib/services/contract-timeline";

interface ContractTimelineProps {
  rows: ContractTimelineRow[];
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function DaysRemainingPill({ days }: { days: number }) {
  if (days === 999) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-900/30 dark:text-slate-400">
        Ongoing
      </span>
    );
  }
  if (days < 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
        Ended
      </span>
    );
  }
  if (days < 15) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
        {days}d
      </span>
    );
  }
  if (days < 30) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        {days}d
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
      {days}d
    </span>
  );
}

/** Progress bar color by % elapsed */
function barColor(progress: number, daysRemaining: number): string {
  if (daysRemaining < 0 || progress >= 100) return "bg-red-500";
  if (daysRemaining < 15) return "bg-red-500";
  if (daysRemaining < 30) return "bg-amber-500";
  return "bg-brand-500";
}

export default function ContractTimeline({ rows }: ContractTimelineProps) {
  const displayedRows = rows.slice(0, 10);

  return (
    <div className="min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/50">
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Active Contract Timeline
        </span>
        
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
          <FileSignature className="h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            No active contracts found
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            There are currently no active contracts matching your filter.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {[
                  "Seafarer",
                  "Rank",
                  "Vessel",
                  "Contract Start",
                  "Contract End",
                  "Timeline",
                  "Days Remaining",
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
              {displayedRows.map((row) => (
                <tr
                  key={row.contractId}
                  className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* Seafarer */}
                  <td className="py-3.5 px-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={row.profilePhoto} name={row.seafarerName} size="xsmall" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {row.seafarerName}
                      </span>
                    </div>
                  </td>

                  {/* Rank */}
                  <td className="py-3.5 px-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {row.rank}
                  </td>

                  {/* Vessel */}
                  <td className="py-3.5 px-2 text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                    {row.vesselName}
                  </td>

                  {/* Start */}
                  <td className="py-3.5 px-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(row.contractStart)}
                  </td>

                  {/* End */}
                  <td className="py-3.5 px-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(row.contractEnd)}
                  </td>

                  {/* Progress bar */}
                  <td className="py-3.5 px-2 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor(row.progress, row.daysRemaining)}`}
                          style={{ width: `${Math.min(100, row.progress)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 w-8 text-right flex-shrink-0">
                        {row.progress}%
                      </span>
                    </div>
                  </td>

                  {/* Days remaining pill */}
                  <td className="py-3.5 px-2">
                    <DaysRemainingPill days={row.daysRemaining} />
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
