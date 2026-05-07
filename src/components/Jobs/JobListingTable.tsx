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
      className="block h-full group"
    >
      <article className="relative grid h-full min-h-[160px] sm:min-h-[200px] grid-cols-[minmax(0,1fr)_80px] sm:grid-cols-[minmax(0,1fr)_100px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
        {/* Diagonal stripe pattern background */}
        <div
          className="pointer-events-none absolute inset-0"
        />

        {/* ── Left Content ── */}
        <div className="relative flex min-w-0 flex-col px-4 py-4 sm:px-6 sm:py-5">
          {/* Company Logo + Info */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 sm:h-20 sm:w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-200 dark:bg-white">
              {job.companyLogo ? (
                <Image
                  src={job.companyLogo}
                  alt={job.companyName}
                  width={72}
                  height={72}
                  className="object-contain p-1.5 sm:p-2.5"
                  unoptimized
                />
              ) : (
                <>
                  <Users size={24} className="text-gray-300 sm:hidden dark:text-gray-400" />
                  <Users size={32} className="hidden sm:block text-gray-300 dark:text-gray-400" />
                </>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="mb-0.5 truncate text-xs sm:text-sm font-bold text-brand-600 dark:text-brand-400">
                {job.companyName}
              </p>
              <h3 className="line-clamp-2 text-base sm:text-lg font-extrabold leading-tight text-gray-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                {job.title}
              </h3>
              {/* Teal underline accent */}
              <div className="mt-1.5 sm:mt-2 h-0.5 w-8 sm:w-10 rounded-full bg-brand-400" />
            </div>
          </div>

          {/* Info Rows */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Location Row */}
            <div className="flex min-w-0 items-center gap-2 sm:gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2 sm:px-4 sm:py-3 dark:border-gray-700 dark:bg-gray-700/30">
              <span className="flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
                <MapPin size={16} className="sm:hidden" />
                <MapPin size={18} className="hidden sm:block" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-bold text-gray-800 dark:text-gray-200 leading-none mb-0.5">Location</p>
                <p className="truncate text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-none">
                  {job.location || "Location to be confirmed"}
                </p>
              </div>
            </div>

            {/* Deadline Row */}
            <div className="flex min-w-0 items-center gap-2 sm:gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2 sm:px-4 sm:py-3 dark:border-gray-700 dark:bg-gray-700/30">
              <span
                className={`flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                  isUrgent
                    ? "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400"
                    : "bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"
                }`}
              >
                <CalendarDays size={16} className="sm:hidden" />
                <CalendarDays size={18} className="hidden sm:block" />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[10px] sm:text-xs font-bold leading-none mb-0.5 ${
                    isUrgent
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {isUrgent ? "Last Day" : "Deadline"}
                </p>
                <p
                  className={`truncate text-[10px] sm:text-xs font-semibold leading-none ${
                    isUrgent
                      ? "text-red-500 dark:text-red-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <span className={isUrgent ? "text-red-400" : "text-brand-400"}>•</span>{" "}
                  {formattedDate || "No deadline"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar with Ship Image ── */}
        <div className="relative flex flex-col items-center justify-start overflow-hidden">
          {/* Ship background image */}
          <Image
            src="/images/career/shipcover.png"
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
          {/* Teal overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-500/80 via-brand-600/75 to-brand-700/85" />

          {/* Arrow button */}
          <div className="relative z-10 mt-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/30 bg-white text-brand-600 shadow-md transition-all duration-200 group-hover:scale-110 group-hover:border-white/60 group-hover:shadow-lg dark:bg-white dark:text-brand-600">
              <ArrowRight size={18} strokeWidth={2.5} />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
