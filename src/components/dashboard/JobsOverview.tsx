"use client";

import React from "react";
import { format } from "date-fns";
import { Briefcase, Users, Clock } from "lucide-react";

interface JobInfo {
  id: string;
  title: string;
  isAccepting: boolean;
  deadline?: string | null;
  candidateCount: number;
  companyLogo?: string | null;
}

interface JobsOverviewProps {
  data: JobInfo[];
}

export default function JobsOverview({ data }: JobsOverviewProps) {
  return (
    <div className="min-w-0 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 transition-all duration-200 hover:shadow-lg hover:border-brand-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-brand-500/50 flex flex-col">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 block">
        Jobs Overview
      </span>
      <div className="space-y-2 sm:space-y-3 flex-1 overflow-y-auto pr-1 -mr-1">
        {data.map((job) => (
          <div 
            key={job.id} 
            className="group flex flex-wrap items-start gap-3 overflow-hidden rounded-xl border border-gray-50 p-2 transition-all hover:border-brand-200 hover:bg-brand-50/30 dark:border-gray-800/50 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5 sm:p-3"
          >
            <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-4">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-700">
                {job.companyLogo ? (
                  <img src={job.companyLogo} alt="" className="w-full h-full object-contain" />
                ) : (
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-brand-500 transition-colors" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="break-words text-xs font-bold text-gray-900 dark:text-white sm:text-sm">
                  {job.title}
                </h4>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 sm:mt-1 sm:gap-3">
                  <span className={`text-[9px] sm:text-[10px] font-bold px-1 py-0.5 rounded uppercase ${
                    job.isAccepting 
                      ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" 
                      : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                  }`}>
                    {job.isAccepting ? "Open" : "Closed"}
                  </span>
                  {job.deadline && (
                    <div className="flex items-center gap-1 whitespace-nowrap text-[9px] text-gray-500 dark:text-gray-400 sm:text-[10px]">
                      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {format(new Date(job.deadline), "dd MMM yyyy")}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center justify-end gap-x-2 gap-y-1 rounded-lg bg-gray-50/80 px-2 py-1.5 text-right dark:bg-gray-800/60">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-gray-400" />
                <span className="text-xs font-bold text-gray-900 dark:text-white sm:text-sm">
                  {job.candidateCount}
                </span>
              </div>
              <span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Applicants
              </span>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-500">No active jobs found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
