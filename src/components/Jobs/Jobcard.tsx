import Image from "next/image";
import Link from "next/link";
import { buildCompanyCareerJobPath } from "@/lib/careerLinks";

interface JobCardProps {
  _id: string;
  title: string;
  description?: string;
  companyId: string;
  companyName: string;
  companyLogo?: string;
  location?: string;
  deadline?: string | null;
  applicationLink: string;
}

export default function JobCard({
  _id,
  title,
  companyId,
  companyName,
  companyLogo,
  deadline,
}: JobCardProps) {
  const parseUTCDate = (iso: string): Date => {
    const d = new Date(iso);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  };

  const todayUTC = (() => {
    const n = new Date();
    return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
  })();

  const deadlineDate = deadline ? parseUTCDate(deadline) : null;

  const daysLeft = deadlineDate
    ? Math.ceil((deadlineDate.getTime() - todayUTC.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isUrgent = daysLeft !== null && daysLeft <= 7;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 14 && !isUrgent;

  const formattedDate = deadlineDate
    ? deadlineDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : null;

  const deadlineLabel = formattedDate
    ? isUrgent && daysLeft !== null
      ? daysLeft <= 0
        ? `Closes today · ${formattedDate}`
        : daysLeft === 1
          ? `Last day · ${formattedDate}`
          : `${daysLeft} days left · ${formattedDate}`
      : `Deadline: ${formattedDate}`
    : "No deadline";

 const deadlineColor = isUrgent
  ? "text-red-600 dark:text-red-400"
  : "text-gray-500 dark:text-gray-400";

  return (
    <Link href={buildCompanyCareerJobPath(companyId, _id)} className="block group">
      <div className="flex items-center gap-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-md transition-all duration-200">

        {/* Logo */}
        <div className="flex-shrink-0 w-20 h-20 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex items-center justify-center overflow-hidden">
          {companyLogo ? (
            <Image
              src={companyLogo}
              alt={companyName}
              width={72}
              height={72}
              className="object-contain p-1.5"
              unoptimized
            />
          ) : (
            <svg className="w-9 h-9 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wide truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {title}
          </h3>
          <p className={`text-sm font-medium ${deadlineColor}`}>
            {deadlineLabel}
          </p>
          <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 truncate">
            {companyName}
          </p>
        </div>

        {/* Arrow */}
        <div className="flex-shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-brand-400 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

      </div>
    </Link>
  );
}
