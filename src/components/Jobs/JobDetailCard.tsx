"use client";

import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { buildCompanyCareersPath } from "@/lib/careerLinks";

interface JobDetailCardProps {
  title: string;
  description?: string;
  deadline?: string | null;
  location?: string;
  applicationLink?: string;
  companyId: string;
  companyName: string;
  companyLogo?: string;
  postedAt?: string;
  hasApplied: boolean;
  requiresAuth?: boolean;
  onAuthRequired?: () => void;
}

export default function JobDetailCard({
  title,
  description,
  deadline,
  location,
  applicationLink,
  companyId,
  companyName,
  companyLogo,
  postedAt,
  hasApplied,
  requiresAuth = false,
  onAuthRequired,
}: JobDetailCardProps) {
  const formattedDeadline = deadline
    ? new Date(deadline).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : null;

  const deadlineDate = deadline ? new Date(deadline) : null;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const daysLeft = deadlineDate
    ? Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;
    const isExpired = deadlineDate ? deadlineDate.getTime() < today.getTime() : false;

  return (
    <div className="w-full max-w-4xl mx-auto mt-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10">

        {/* ── TOP SECTION: Logo + Title + Meta ── */}
        <div className="flex flex-col md:flex-row">

          {/* Left: Logo Panel */}
          <div className="flex flex-col items-center justify-center p-8 md:p-10 md:w-64 bg-gray-50 dark:bg-gray-800/60 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/10 flex-shrink-0">
            <div className="w-28 h-28 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-sm mb-4">
              {companyLogo ? (
                <Image
                  src={companyLogo}
                  alt={companyName}
                  width={96}
                  height={96}
                  className="object-contain p-2"
                  unoptimized
                />
              ) : (
                <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )}
            </div>
            <p className="text-sm font-bold text-gray-800 dark:text-white text-center">{companyName}</p>
            {location && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">{location}</p>
            )}
          </div>

          {/* Right: Title + Meta only */}
          <div className="flex-1 p-8 md:p-10">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-6">
              {title}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {formattedDeadline && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Closing Date</p>
                 <p className={`text-sm font-bold ${
  daysLeft !== null && daysLeft <= 7
    ? "text-red-600 dark:text-red-400"
    : "text-gray-800 dark:text-gray-200"
}`}>
  {formattedDeadline}
  {daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 && (
    <span className="ml-2 text-xs font-medium opacity-75">
      ({daysLeft === 0 ? "Today" : `${daysLeft}d left`})
    </span>
  )}
</p>
                </div>
              )}

              {postedAt && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Job Published</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{postedAt}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div className="border-t border-gray-100 dark:border-white/10" />

        {/* ── DESCRIPTION SECTION ── */}
        <div className="p-8 md:p-10">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
            Brief Description
          </h2>
          <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            <div
  className="rte-content text-sm text-gray-700 dark:text-gray-300"
  dangerouslySetInnerHTML={{ __html:description || "" }}
/>
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div className="border-t border-gray-100 dark:border-white/10" />

        {/* ── FOOTER: Back link + CTA ── */}
        <div className="px-8 md:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href={buildCompanyCareersPath(companyId)}
            className="inline-flex items-center gap-1.5 text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 font-semibold transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            View all openings
          </Link>

         {hasApplied || isExpired ? (
  <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 text-sm font-bold rounded-xl cursor-not-allowed border border-gray-200 dark:border-gray-700">
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={
        isExpired && !hasApplied
          ? "M6 18L18 6M6 6l12 12"
          : "M5 13l4 4L19 7"
      } />
    </svg>
    {isExpired && !hasApplied ? "Applications Closed" : "Already Applied"}
  </div>
) : requiresAuth ? (
  <Button
    size="md"
    variant="primary"
    onClick={onAuthRequired}
  >
    Sign in to Apply
  </Button>
) : (
  <Button
    size="md"
    variant="primary"
    onClick={() => {
      window.location.href = applicationLink || `/careers/apply?company=${companyId}`;
    }}
  >
    Apply for this Position
  </Button>
)}
        </div>

      </div>
    </div>
  );
}
