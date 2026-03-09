import Image from "next/image";
import Link from "next/link";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";

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
  description,
  companyId,
  companyName,
  companyLogo,
  location,
  deadline,
  applicationLink,
}: JobCardProps) {
  const now = new Date();

  const deadlineDate = deadline ? new Date(deadline) : null;
  const daysLeft = deadlineDate
    ? Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isUrgent = daysLeft !== null && daysLeft <= 7;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 14 && !isUrgent;

  const deadlineLabel = deadlineDate
    ? isUrgent
      ? daysLeft === 0
        ? "Closes today"
        : daysLeft === 1
          ? "Last day"
          : `${daysLeft} days left`
      : isExpiringSoon
        ? `${daysLeft} days left`
        : deadlineDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
    : "No deadline";

  const logoSlot = (
    <div className="relative w-full aspect-[785/160] rounded-xl overflow-hidden bg-white px-4">
      {companyLogo ? (
        <Image
          src={companyLogo}
          alt={companyName}
          fill
          className="object-contain p-2"
          unoptimized
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      )}
    </div>
  );

  return (
    <ComponentCard
      title={logoSlot}
      className="hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex flex-col gap-4">

        {/* ── Job Title ── */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate leading-snug">
          {title}
        </h3>

        {/* ── Company Name ── */}
        <p className="text-sm font-medium text-brand-600 dark:text-brand-400 -mt-2">
          {companyName}
        </p>

        {/* ── Description ── */}
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed h-10">
          {description || "Join our team in this exciting new opportunity."}
        </p>

        {/* ── Meta rows ── */}
        <div className="flex flex-col gap-2">

          {location && (
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs text-gray-500 truncate">{location}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-gray-500">Crew Application</span>
          </div>

          <div className="flex items-center gap-2">
            <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isUrgent ? "text-red-500" : isExpiringSoon ? "text-amber-500" : "text-gray-400"
              }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-xs font-medium ${isUrgent ? "text-red-600" : isExpiringSoon ? "text-amber-600" : "text-gray-500"
              }`}>
              {deadlineLabel}
            </span>
          </div>

        </div>

        {/* ── CTA ── */}
        <Link href={`/careers?company=${companyId}`} className="w-full">
          <Button variant="primary" size="sm" className="w-full shadow-lg shadow-brand-500/10">
            View Details
          </Button>
        </Link>

      </div>
    </ComponentCard>
  );
}