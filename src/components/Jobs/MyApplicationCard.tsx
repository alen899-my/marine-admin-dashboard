import Link from "next/link";
import Image from "next/image";
import {
  canEditPublicApplication,
  canEditPublicApplicationStatus,
} from "@/lib/utils";

interface MyApplicationCardProps {
  appId: string;
  companyId: string;
  companyName: string;
  companyLogo?: string;
  rank?: string;
  positionApplied?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  jobIsAccepting?: boolean;
  deadline?: string | null;
}

const STATUS_MAP: Record<string, { dot: string; pill: string; label: string }> = {
  draft:               { dot: "bg-gray-400",   pill: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",          label: "Draft"               },
  submitted:           { dot: "bg-blue-500",   pill: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",        label: "Submitted"           },
  hr_review:           { dot: "bg-indigo-500", pill: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400", label: "HR Review"          },
  shortlisted:         { dot: "bg-purple-500", pill: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400", label: "Shortlisted"        },
  interview_scheduled: { dot: "bg-cyan-500",   pill: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400",      label: "Interview Scheduled" },
  interview_completed: { dot: "bg-teal-500",   pill: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400",      label: "Interview Completed" },
  selected:            { dot: "bg-emerald-500",pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400", label: "Selected"          },
  offer_sea_issued:    { dot: "bg-lime-500",   pill: "bg-lime-50 text-lime-700 dark:bg-lime-500/10 dark:text-lime-400",      label: "Offer/SEA Issued"    },
  accepted:            { dot: "bg-green-600",  pill: "bg-green-100 text-green-800 dark:bg-green-600/20 dark:text-green-300",    label: "Accepted"            },
  onboarding_ready:    { dot: "bg-green-500",  pill: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400",    label: "Onboarding Ready"    },
  onboarded:           { dot: "bg-green-600",  pill: "bg-green-100 text-green-800 dark:bg-green-600/20 dark:text-green-300",    label: "Onboarded"           },
  rejected:            { dot: "bg-rose-500",   pill: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",      label: "Rejected"            },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

function MetaChip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 min-w-0">
      <span className="flex-shrink-0 text-gray-400 dark:text-gray-500">{icon}</span>
      <span className="truncate">{children}</span>
    </span>
  );
}

const IconPerson = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const IconBriefcase = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const IconCalendar = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const IconChevron = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
  </svg>
);
const IconEdit = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

export default function MyApplicationCard({
  appId,
  companyId,
  companyName,
  companyLogo,
  rank,
  positionApplied,
  status,
  createdAt,
  jobIsAccepting,
  deadline,
}: MyApplicationCardProps) {
  const canEdit =
    canEditPublicApplicationStatus(status) &&
    canEditPublicApplication({
      jobIsAccepting,
      deadline,
    });

  const formattedDate = new Date(createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="
      group relative rounded-2xl overflow-hidden
      border border-gray-100 dark:border-white/10
      bg-white dark:bg-gray-900
      shadow-sm hover:shadow-md dark:shadow-none
      hover:border-gray-200 dark:hover:border-white/20
      transition-all duration-150
    ">
      <div className="flex items-center gap-3 sm:gap-4">

        {/* ── Logo panel ── */}
        <div className="
          flex-shrink-0
          w-16 self-stretch
          flex items-center justify-center
          bg-gray-50 dark:bg-gray-800/60
          border-r border-gray-100 dark:border-white/10
        ">
         
        </div>

        {/* ── Main info ── */}
        <div className="flex-1 min-w-0 py-3.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
            <span className="text-sm font-bold text-gray-900 dark:text-white truncate leading-snug">
              {companyName}
            </span>
            <StatusBadge status={status} />
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {rank && <MetaChip icon={<IconPerson />}>{rank}</MetaChip>}
            {positionApplied && <MetaChip icon={<IconBriefcase />}>{positionApplied}</MetaChip>}
            <MetaChip icon={<IconCalendar />}>{formattedDate}</MetaChip>
          </div>
          {status === "draft" && (
            <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
              You have not completed all steps.
            </p>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center gap-1.5 flex-shrink-0 pr-4">
          <Link
            href={`/careers/view/${appId}?company=${companyId}`}
            aria-label={`View application for ${companyName}`}
            className="
              inline-flex items-center justify-center gap-1.5
              h-8 px-1.5 sm:px-3
              text-xs font-semibold
              text-brand-600 dark:text-brand-400
              bg-brand-50 dark:bg-brand-500/10
              hover:bg-brand-100 dark:hover:bg-brand-500/20
              rounded-lg transition-colors whitespace-nowrap
            "
          >
            <span className="hidden sm:inline">View</span>
            <IconChevron />
          </Link>

          {canEdit && (
            <Link
              href={`/careers/edit/${appId}?company=${companyId}`}
              aria-label={`Edit application for ${companyName}`}
              className="
                inline-flex items-center justify-center gap-1.5
                h-8 px-1.5 sm:px-3
                text-xs font-semibold
                text-gray-600 dark:text-gray-300
                bg-gray-100 dark:bg-white/5
                hover:bg-gray-200 dark:hover:bg-white/10
                rounded-lg transition-colors whitespace-nowrap
              "
            >
              <IconEdit />
              <span className="hidden sm:inline">Edit</span>
            </Link>
          )}
        </div>

      </div>
    </article>
  );
}
