"use client";

import React from "react";
import { Monitor } from "lucide-react";
import Avatar from "@/components/ui/avatar/Avatar";
import type { RecentLoginRow } from "@/lib/services/user-access";

interface RecentLoginTableProps {
  rows: RecentLoginRow[];
}

function formatDateTime(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function timeAgo(iso: string): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function RecentLoginTable({ rows }: RecentLoginTableProps) {
  return (
    <div className="min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/50">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Recent Login Activity
        </span>
        {rows.length > 0 && (
          <span className="shrink-0 pr-12 text-xs text-gray-400 dark:text-gray-500">
            Last {rows.length}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <Monitor className="h-9 w-9 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No recent login sessions found.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[580px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {["User", "Email", "Login At", "IP Address", "Last Seen"].map(
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
                  key={row.sessionId}
                  className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* User */}
                  <td className="py-3.5 px-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={row.profilePicture} name={row.userName} size="xsmall" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {row.userName}
                      </span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="py-3.5 px-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {row.email}
                  </td>

                  {/* Login At */}
                  <td className="py-3.5 px-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {formatDateTime(row.loginAt)}
                  </td>

                  {/* IP */}
                  <td className="py-3.5 px-2">
                    {row.ip ? (
                      <span className="inline-block rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-mono text-gray-600 dark:text-gray-400">
                        {row.ip}
                      </span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600 text-sm italic">
                        Unknown
                      </span>
                    )}
                  </td>

                  {/* Last Seen */}
                  <td className="py-3.5 px-2">
                    <span
                      className="text-xs font-medium text-gray-500 dark:text-gray-400"
                      title={formatDateTime(row.lastSeenAt)}
                    >
                      {timeAgo(row.lastSeenAt)}
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
