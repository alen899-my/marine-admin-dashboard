import Link from "next/link";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { dot: string; pill: string; label: string }> = {
  draft:     { dot: "bg-gray-400",   pill: "bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300",             label: "Draft"      },
  submitted: { dot: "bg-blue-500",   pill: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",              label: "Submitted"  },
  reviewing: { dot: "bg-yellow-500", pill: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",      label: "Reviewing"  },
  approved:  { dot: "bg-green-500",  pill: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400",          label: "Approved"   },
  rejected:  { dot: "bg-red-500",    pill: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",                  label: "Rejected"   },
  on_hold:   { dot: "bg-orange-500", pill: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",      label: "On Hold"    },
  archived:  { dot: "bg-gray-400",   pill: "bg-gray-100 text-gray-500 dark:bg-gray-700/60 dark:text-gray-400",             label: "Archived"   },
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

// ─── Meta chip ────────────────────────────────────────────────────────────────

function MetaChip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 min-w-0">
      <span className="flex-shrink-0 text-gray-400 dark:text-gray-500">{icon}</span>
      <span className="truncate">{children}</span>
    </span>
  );
}

// ─── Icons (inline to avoid extra deps) ──────────────────────────────────────

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

const IconBuilding = () => (
  <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function MyApplicationCard({
  appId,
  companyId,
  companyName,
  companyLogo,
  rank,
  positionApplied,
  status,
  createdAt,
}: MyApplicationCardProps) {
  const canEdit = ["draft", "submitted"].includes(status);
  const formattedDate = new Date(createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="
      group relative rounded-2xl border border-gray-200 bg-white
      dark:border-gray-800 dark:bg-white/[0.03]
      px-4 py-3.5
      hover:border-gray-300 dark:hover:border-gray-700
      hover:shadow-sm
      transition-all duration-150
    ">
      {/* ── Single-row layout: logo | info | actions ── */}
      <div className="flex items-center gap-3 sm:gap-4">

        {/* ── Logo ─────────────────────────────────────── */}
        <div className="
          flex-shrink-0
          w-10 h-10 sm:w-11 sm:h-11
          rounded-xl overflow-hidden
          bg-gray-50 dark:bg-gray-800/80
          border border-gray-100 dark:border-gray-700/50
          flex items-center justify-center
        ">
          {companyLogo ? (
            <Image
              src={companyLogo}
              alt={`${companyName} logo`}
              width={44}
              height={44}
              className="object-contain w-full h-full"
              unoptimized
            />
          ) : (
            <IconBuilding />
          )}
        </div>

        {/* ── Main info ─────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Row 1: name + badge */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
            <span className="text-sm font-semibold text-gray-900 dark:text-white/90 truncate leading-snug">
              {companyName}
            </span>
            <StatusBadge status={status} />
          </div>

          {/* Row 2: meta chips */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {rank && (
              <MetaChip icon={<IconPerson />}>{rank}</MetaChip>
            )}
            {positionApplied && (
              <MetaChip icon={<IconBriefcase />}>
                {positionApplied}
              </MetaChip>
            )}
            <MetaChip icon={<IconCalendar />}>{formattedDate}</MetaChip>
          </div>
        </div>

        {/* ── Actions ──────────────────────────────────── */}
        {/*
          On xs: icon-only buttons to save horizontal space.
          On sm+: labelled buttons.
        */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto pl-2">

          {/* View */}
          <Link
            href={`/careers/view/${appId}?company=${companyId}`}
            aria-label={`View application for ${companyName}`}
            className="
              inline-flex items-center justify-center gap-1.5
              h-8
              px-1.5 sm:px-3
              text-xs font-semibold
              text-brand-600 dark:text-brand-400
              bg-brand-50 dark:bg-brand-500/10
              hover:bg-brand-100 dark:hover:bg-brand-500/20
              rounded-lg transition-colors
              whitespace-nowrap
            "
          >
            <span className="hidden sm:inline">View</span>
            <IconChevron />
          </Link>

          {/* Edit — only when editable */}
          {canEdit && (
            <Link
              href={`/careers/edit/${appId}?company=${companyId}`}
              aria-label={`Edit application for ${companyName}`}
              className="
                inline-flex items-center justify-center gap-1.5
                h-8
                px-1.5 sm:px-3
                text-xs font-semibold
                text-gray-600 dark:text-gray-400
                bg-gray-100 dark:bg-gray-800
                hover:bg-gray-200 dark:hover:bg-gray-700
                rounded-lg transition-colors
                whitespace-nowrap
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