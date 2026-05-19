"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import Select from "@/components/form/Select";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  canEditPublicApplication,
  canEditPublicApplicationStatus,
} from "@/lib/utils";

// ── Status config ───────────────────────────────────────────────────────────

type StatusColor = 
  | "slate" | "sky" | "indigo" | "purple" | "cyan" 
  | "teal" | "emerald" | "lime" | "green" | "gray" | "rose";

const STATUS_CONFIG: Record<string, { label: string; color: StatusColor; dot: string }> = {
  all:                 { label: "All",                 color: "gray",    dot: "bg-gray-400" },
  draft:               { label: "Draft",               color: "slate",   dot: "bg-gray-400" },
  submitted:           { label: "Submitted",           color: "sky",     dot: "bg-blue-500" },
  hr_review:           { label: "HR Review",           color: "indigo",  dot: "bg-indigo-500" },
  shortlisted:         { label: "Shortlisted",         color: "purple",  dot: "bg-purple-500" },
  interview_scheduled: { label: "Interview Scheduled", color: "cyan",    dot: "bg-cyan-500" },
  interview_completed: { label: "Interview Completed", color: "teal",    dot: "bg-teal-500" },
  selected:            { label: "Selected",            color: "emerald", dot: "bg-emerald-500" },
  offer_sea_issued:    { label: "Offer/SEA Issued",    color: "lime",    dot: "bg-lime-500" },
  accepted:            { label: "Accepted",            color: "green",   dot: "bg-green-600" },
  onboarding_ready:    { label: "Onboarding Ready",    color: "green",   dot: "bg-green-500" },
  onboarded:           { label: "Onboarded",           color: "green",   dot: "bg-green-600" },
  rejected:            { label: "Rejected",            color: "rose",    dot: "bg-rose-500" },
};

const ALL_STATUSES = [
  "all",
  "draft",
  "submitted",
  "hr_review",
  "shortlisted",
  "interview_scheduled",
  "interview_completed",
  "selected",
  "offer_sea_issued",
  "accepted",
  "onboarding_ready",
  "onboarded",
  "rejected",
];

const STATUS_OPTIONS = ALL_STATUSES.map((s) => ({
  value: s,
  label: STATUS_CONFIG[s].label,
}));

// ── Application Card ────────────────────────────────────────────────────────

function ApplicationCard({ app }: { app: any }) {
  const canEdit =
    canEditPublicApplicationStatus(app.status) &&
    canEditPublicApplication({
      jobIsAccepting: app.jobIsAccepting,
      deadline: app.deadline,
    });

  const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.draft;

  return (
    <div className="group relative flex flex-col gap-4 p-5 rounded-2xl border border-gray-300 dark:border-gray-800 bg-white dark:bg-white/[0.02] hover:border-brand-200 dark:hover:border-brand-500/30 hover:shadow-lg dark:hover:shadow-brand-500/5 transition-all duration-200">

      {/* Header: Logo + Status */}
      <div className="flex items-start justify-between gap-3">
        {/* Company Logo */}
        <div className="flex-shrink-0">
          {app.company?.logo ? (
            <Image
              src={app.company.logo}
              alt={app.company?.name ?? ""}
              width={785}
              height={220}
              className="w-40 max-w-full rounded-xl object-contain border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-1"
              unoptimized
            />
          ) : (
            <div className="w-40 aspect-[785/220] rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center border border-brand-100 dark:border-brand-500/20">
              <svg
                className="w-7 h-7 text-brand-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Status badge */}
        <Badge color={cfg.color} size="sm">{cfg.label}</Badge>
      </div>

      {/* Body: Company + Role */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate mb-0.5">
          {app.company?.name ?? "—"}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {app.rank}
          {app.positionApplied && app.positionApplied !== app.rank && (
            <span className="text-gray-400 dark:text-gray-500 ml-1">
              ({app.positionApplied})
            </span>
          )}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Applied{" "}
          {new Date(app.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
        {app.status === "draft" && (
          <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
            You have not completed all steps.
          </p>
        )}
      </div>

      {/* Footer: Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
     <Link
  href={`/careers/view/${app._id}?company=${app.company?._id ?? ""}`}
  className={canEdit ? "flex-1" : "w-full"}  
>
          <Button
            size="sm"
            variant="primary"
            className="w-full"
            endIcon={
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            }
          >
            View
          </Button>
        </Link>

        {canEdit && (
          <Link href={`/careers/edit/${app._id}?company=${app.company?._id ?? ""}`} className="flex-1">
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              startIcon={
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              }
            >
              Edit
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

interface ApplicationsTableProps {
  applications: any[];
}

export default function ApplicationsTable({ applications }: ApplicationsTableProps) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: applications.length };
    for (const app of applications) {
      counts[app.status] = (counts[app.status] ?? 0) + 1;
    }
    return counts;
  }, [applications]);

  const filtered = useMemo(() => {
    let list = applications;
    if (activeFilter !== "all") {
      list = list.filter((a) => a.status === activeFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.company?.name?.toLowerCase().includes(q) ||
          a.rank?.toLowerCase().includes(q) ||
          a.positionApplied?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [applications, activeFilter, search]);

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          No applications yet
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs">
          You haven&apos;t submitted any applications yet.{" "}
          <Link href="/careers" className="text-brand-500 hover:underline font-medium">
            Browse opportunities →
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Filters bar ── */}
      <div className="flex flex-wrap items-end gap-3">

        {/* Status dropdown */}
        <div className="w-full sm:w-48">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block ml-1">
            Status
          </label>
          <Select
            options={STATUS_OPTIONS}
            value={activeFilter}
            onChange={(val) => setActiveFilter(val || "all")}
            placeholder="All Status"
          />
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block ml-1">
            Search
          </label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Company, rank, position…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full pl-10 pr-9 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300 dark:focus:border-brand-800 shadow-theme-xs transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Reset */}
        {(activeFilter !== "all" || search) && (
          <button
            onClick={() => { setActiveFilter("all"); setSearch(""); }}
            className="h-11 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            Reset
          </button>
        )}
      </div>

      {/* ── Application grid ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-0.5">
            No results found
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Try adjusting your filters or search term.
          </p>
          <button
            onClick={() => { setActiveFilter("all"); setSearch(""); }}
            className="mt-3 text-xs text-brand-500 hover:text-brand-600 font-medium hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((app: any) => (
            <ApplicationCard key={app._id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}
