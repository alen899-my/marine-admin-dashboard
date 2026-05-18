"use client";

import React from "react";
import Link from "next/link";
import { FileX } from "lucide-react";
import Avatar from "@/components/ui/avatar/Avatar";

export interface ExpiryRow {
  seafarerName: string;
  profilePhoto?: string | null;
  documentType: string;
  documentNumber: string;
  expiryDate: Date | string;
  daysRemaining: number;
}

interface ExpiryTableProps {
  rows: ExpiryRow[];
}

function DaysRemainingPill({ days }: { days: number }) {
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
        Expired
      </span>
    );
  }
  if (days < 30) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
        {days}d
      </span>
    );
  }
  if (days < 60) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        {days}d
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
      {days}d
    </span>
  );
}

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}



export default function ExpiryTable({ rows }: ExpiryTableProps) {
  const displayedRows = rows.slice(0, 10);

  return (
    <div className="min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/50 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Expiring Documents — Next 90 Days
        </span>
        <Link href="/compliance-expiry" className="text-sm text-brand-500 hover:text-brand-600 font-medium">
          View More
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
          <FileX className="h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            No documents expiring in the next 90 days
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            All seafarer documents are up to date.
          </p>
        </div>
      ) : (
        <div className="overflow-auto flex-1 pr-1 -mr-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
                  Seafarer Name
                </th>
                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
                  Document Type
                </th>
                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
                  Document Number
                </th>
                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
                  Expiry Date
                </th>
                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
                  Days Remaining
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {displayedRows.map((row, i) => (
                <tr
                  key={i}
                  className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3.5 px-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={row.profilePhoto} name={row.seafarerName} size="xsmall" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {row.seafarerName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-2 text-sm text-gray-600 dark:text-gray-400">
                    {row.documentType}
                  </td>
                  <td className="py-3.5 px-2 text-sm font-mono text-gray-700 dark:text-gray-300">
                    {row.documentNumber}
                  </td>
                  <td className="py-3.5 px-2 text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(row.expiryDate)}
                  </td>
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
