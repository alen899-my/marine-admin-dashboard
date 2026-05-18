"use client";

import React from "react";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import { format } from "date-fns";

interface Application {
  id: string;
  name: string;
  rank: string;
  jobTitle: string;
  status: string;
  appliedDate: string;
  assignedTo: string;
}

interface RecentApplicationsProps {
  data: Application[];
}

export default function RecentApplications({ data }: RecentApplicationsProps) {
  return (
    <div className="min-w-0 w-full rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/50 flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
          Recent Applications
        </span>
        {data.length > 0 && (
          <Link href="/candidates" className="text-sm text-brand-500 hover:text-brand-600 font-medium">
            View More
          </Link>
        )}
      </div>
      <div className="overflow-auto flex-1 pr-1 -mr-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">Name</th>
              <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">Job Position</th>
              <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">Rank</th>
              
              <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 text-right">Applied Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {data.map((app) => (
              <tr key={app.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="py-4 px-2 text-sm font-medium text-gray-900 dark:text-white">{app.name}</td>
                <td className="py-4 px-2 text-sm text-gray-600 dark:text-gray-400">{app.jobTitle}</td>
                <td className="py-4 px-2 text-sm text-gray-600 dark:text-gray-400">{app.rank}</td>
                
                
                <td className="py-4 px-2 text-sm text-gray-600 dark:text-gray-400 text-right">
                  {format(new Date(app.appliedDate), "dd MMM yyyy")}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-sm text-gray-500">
                  No recent applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
