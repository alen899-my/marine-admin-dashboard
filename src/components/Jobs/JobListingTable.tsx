"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useRef } from "react";
import Input from "@/components/form/input/InputField";
import SearchableSelect from "@/components/form/SearchableSelect";
import Pagination from "@/components/tables/Pagination";
import { buildCompanyCareerJobPath } from "@/lib/careerLinks";
import {
  MapPin,
  Briefcase,
  ArrowRight,
  Search,
  Users,
  TrendingUp,
  Globe,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import Button from "../ui/button/Button";

interface JobItem {
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

interface CompanyOption {
  _id: string;
  name: string;
}

interface Props {
  jobs: JobItem[];
  companies?: CompanyOption[];
  heroEyebrow?: string;
  heroTitle?: string;
  heroDescription?: string;
  listingTitle?: string;
  listingDescription?: string;
  hideCompanyFilter?: boolean;
}

const ITEMS_PER_PAGE = 12;

// ── Deadline helpers ──
function parseUTCDate(iso: string): Date {
  const d = new Date(iso);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function getTodayUTC(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

// ── Value proposition data ──
const VALUE_PROPS = [
  {
    icon: Users,
    title: "People First",
    desc: "We value our people and foster a supportive culture.",
  },
  {
    icon: TrendingUp,
    title: "Grow Together",
    desc: "Continuous learning and career development.",
  },
  {
    icon: ShieldCheck,
    title: "Do Meaningful Work",
    desc: "Work on impactful projects that drive the industry.",
  },
  {
    icon: Globe,
    title: "Global Impact",
    desc: "A diverse team with a shared purpose worldwide.",
  },
];

export default function CompaniesTable({
  jobs,
  companies = [],
  heroEyebrow = "Careers at Parkora",
  heroTitle = "Navigate your career.\nMake an impact.",
  heroDescription = "Join a global team that powers the maritime industry with expertise, innovation and integrity.",
  listingTitle = "Find your next opportunity",
  listingDescription = "Explore open roles across departments and locations.",
  hideCompanyFilter = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const listingRef = useRef<HTMLDivElement>(null);

  // ── Filtered jobs ──
  const filtered = useMemo(() => {
    let result = [...jobs];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.companyName.toLowerCase().includes(q)
      );
    }
    if (companyFilter && companyFilter !== "all") {
      result = result.filter((j) => j.companyId === companyFilter);
    }
    return result;
  }, [jobs, search, companyFilter]);

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    listingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Reset page when filters change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };
  const handleCompanyChange = (val: string) => {
    setCompanyFilter(val);
    setCurrentPage(1);
  };

  const companyOptions = [
    { value: "all", label: "All Companies" },
    ...companies.map((c) => ({ value: c._id, label: c.name })),
  ];

  const heroTitleLines = heroTitle.split("\n");

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">

      {/* ══════════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="relative w-full h-[420px] sm:h-[480px] lg:h-[760px] overflow-hidden">
        {/* Background Image */}
        <Image
          src="/images/career/shipcover.png"
          alt="Maritime careers"
          fill
          priority
          className="object-cover"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/60 to-gray-900/30" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center h-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-brand-400 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-3">
            {heroEyebrow}
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4 max-w-2xl">
            {heroTitleLines.map((line, index) => (
              <span key={`${line}-${index}`}>
                {line}
                {index < heroTitleLines.length - 1 ? <br /> : null}
              </span>
            ))}
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-lg mb-8">
            {heroDescription}
          </p>
          <Button
          variant="primary"
            onClick={() =>
              listingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="inline-flex items-center gap-2 w-fit px-6 py-3text-gray-900  font-semibold text-sm rounded-lg shadow-lg transition-all duration-200 group"
          >
            Explore Opportunities
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          VALUE PROPOSITIONS
      ══════════════════════════════════════════════════════════ */}
      <section className="border-b border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto grid max-w-[1760px] grid-cols-1 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {VALUE_PROPS.map((vp) => (
            <article
              key={vp.title}
              className="flex items-center gap-5 border-gray-100 py-4 sm:px-5 lg:border-r lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0 dark:border-gray-800"
            >
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
                <vp.icon size={24} strokeWidth={1.9} />
              </span>

              <div className="min-w-0">
                <h3 className="mb-1.5 text-sm font-bold leading-snug text-gray-900 dark:text-white">
                  {vp.title}
                </h3>
                <p className="max-w-[220px] text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {vp.desc}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          JOB LISTINGS
      ══════════════════════════════════════════════════════════ */}
      <section
        ref={listingRef}
        className="max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-8 py-14 scroll-mt-20"
      >
        {/* Heading */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {listingTitle}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {listingDescription}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 max-w-sm relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
              <Search size={16} />
            </div>
            <Input
              placeholder="Search by job title, keyword or company"
              value={search}
              onChange={handleSearchChange}
              className="!pl-10 max-w-sm"
            />
          </div>
          {!hideCompanyFilter && (
            <div className="w-full sm:w-56">
              <SearchableSelect
                options={companyOptions}
                placeholder="All Companies"
                value={companyFilter}
                onChange={handleCompanyChange}
              />
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {filtered.length === 0
              ? "No openings found"
              : `${filtered.length} opening${filtered.length !== 1 ? "s" : ""} found`}
          </span>
        </div>

        {/* ── Job Cards Grid ── */}
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Briefcase size={28} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              No job openings right now
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs">
              {search || companyFilter !== "all"
                ? "Try adjusting your search or filter to find more results."
                : "There are no active job postings at this time. Check back soon."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
            {paginated.map((job) => (
              <JobCardItem key={job._id} job={job} />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-10">
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </section>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   JOB CARD COMPONENT (inline — matches reference design)
═══════════════════════════════════════════════════════════════ */

function JobCardItem({ job }: { job: JobItem }) {
  const todayUTC = getTodayUTC();
  const deadlineDate = job.deadline ? parseUTCDate(job.deadline) : null;
  const daysLeft = deadlineDate
    ? Math.ceil(
        (deadlineDate.getTime() - todayUTC.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;
  const isUrgent = daysLeft !== null && daysLeft <= 7;

  const formattedDate = deadlineDate
    ? deadlineDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : null;

  return (
    <Link
      href={buildCompanyCareerJobPath(job.companyId, job._id)}
      className="block h-full group focus:outline-none"
    >
      <article className="flex flex-col h-full rounded-[24px] border border-gray-100 bg-white p-5 sm:p-7 shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-200 dark:border-gray-800 dark:bg-gray-900">
        {/* Top section: Logo, Info, Arrow */}
        <div className="flex items-start gap-4 sm:gap-5 mb-5 sm:mb-6">
          {/* Logo */}
          <div className="flex h-16 w-16 sm:h-[84px] sm:w-[84px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            {job.companyLogo ? (
              <Image
                src={job.companyLogo}
                alt={job.companyName}
                width={84}
                height={84}
                className="h-full w-full object-contain"
                unoptimized
              />
            ) : (
              <Users size={32} className="text-gray-300 dark:text-gray-600" />
            )}
          </div>

          {/* Title and Company */}
          <div className="flex-1 min-w-0 pt-1">
            <p className="mb-1.5 truncate text-sm sm:text-[15px] font-medium text-brand-600 dark:text-brand-400">
              {job.companyName}
            </p>
            <h3 className="line-clamp-2 text-lg sm:text-[22px] font-bold leading-tight text-gray-800 group-hover:text-brand-600 transition-colors dark:text-white dark:group-hover:text-brand-400">
              {job.title}
            </h3>
          </div>

          {/* Arrow Button */}
          <div className="flex-shrink-0 pt-1 hidden sm:block">
            <span className="flex h-12 w-12 sm:h-[52px] sm:w-[52px] items-center justify-center rounded-full border border-gray-200 text-brand-600 transition-all duration-200 group-hover:border-brand-500 group-hover:bg-brand-50 dark:border-gray-700 dark:text-brand-400 dark:group-hover:bg-brand-500/10 dark:group-hover:border-brand-400">
              <ArrowRight size={22} strokeWidth={1.5} />
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-auto mb-4 sm:mb-5 border-t border-gray-100 dark:border-gray-800" />

        {/* Bottom section: Location & Date */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          {/* Location */}
          <div className="flex items-center gap-2 sm:gap-3 text-gray-700 dark:text-gray-300">
            <MapPin size={22} strokeWidth={1.5} className="text-brand-600 dark:text-brand-400" />
            <span className="text-sm sm:text-[15px]">
              {job.location || "Location to be confirmed"}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 sm:gap-3 text-gray-700 dark:text-gray-300">
            <CalendarDays size={22} strokeWidth={1.5} className={daysLeft !== null && daysLeft <= 3 ? "text-red-500 dark:text-red-400" : "text-brand-600 dark:text-brand-400"} />
            <span className={`text-sm sm:text-[15px] ${daysLeft !== null && daysLeft <= 3 ? 'text-red-600 dark:text-red-400 font-semibold' : ''}`}>
              Last Day: {formattedDate || "No deadline"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
