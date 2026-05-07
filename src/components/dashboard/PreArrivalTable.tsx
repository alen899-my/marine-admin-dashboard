"use client";

import React from "react";
import { Anchor } from "lucide-react";
import type { PreArrivalRow } from "@/lib/services/voyage-ops";

interface PreArrivalTableProps {
  rows: PreArrivalRow[];
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_STYLES: Record<string, string> = {
  published:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  sent: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  acknowledged:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

export default function PreArrivalTable({ rows }: PreArrivalTableProps) {
  return (
    <div className="min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/50">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Pre-Arrival Requests — In Progress
        </span>
        {rows.length > 0 && (
          <span className="shrink-0 pr-12 text-xs text-gray-400 dark:text-gray-500">
            {rows.length} request{rows.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <Anchor className="h-9 w-9 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No pre-arrival requests in progress.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {[
                  "Vessel",
                  "Port",
                  "ETA",
                  "Due Date",
                  "Status",
                  "Docs Pending",
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
                  key={row.requestId}
                  className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3.5 px-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 flex-shrink-0 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Anchor className="h-3.5 w-3.5 text-indigo-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {row.vesselName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-2 text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                    {row.portName}
                  </td>
                  <td className="py-3.5 px-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(row.eta)}
                  </td>
                  <td className="py-3.5 px-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(row.dueDate)}
                  </td>
                  <td className="py-3.5 px-2">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="py-3.5 px-2">
                    {row.pendingDocs > 0 ? (
                      <span className="inline-flex items-center justify-center h-6 min-w-[24px] rounded-full bg-red-100 px-2 text-xs font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {row.pendingDocs}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center h-6 min-w-[24px] rounded-full bg-emerald-100 px-2 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        0
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
