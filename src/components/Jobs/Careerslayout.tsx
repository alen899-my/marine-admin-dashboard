"use client";

import { useState } from "react";
import MyApplicationCard from "@/components/Jobs/MyApplicationCard";
import JobDetailCard from "./JobDetailCard";
import CareerAuthCard from "./Careerauthcard";

export interface JobOpening {
  id: string;
  title: string;
  department?: string;
  location?: string;
  vessel?: string;
  description?: string;
  requirements?: string[];
  applicationLink?: string;
  deadline?: string | null;
  postedAt: string;
}

export interface MyApplication {
  _id: string;
  status: string;
  firstName: string;
  lastName: string;
  rank?: string;
  positionApplied?: string;
  createdAt: string;
  updatedAt: string;
  jobId?: string | null;
  jobIsAccepting?: boolean;   // ← added
  deadline?: string | null;   // ← added
}

interface CareersLayoutProps {
  companyId: string;
  companyName: string;
  companyLogo?: string;
  jobs: JobOpening[];
  userEmail?: string;
  userName?: string;
  myApplications?: MyApplication[];
  jobId?: string;
}

export default function CareersLayout({
  companyId,
  companyName,
  companyLogo,
  jobs,
  userEmail,
  userName,
  myApplications = [],
  jobId,
}: CareersLayoutProps) {
  const latestApplication = myApplications[0] ?? null;
  const hasApplied = latestApplication !== null;
  const selectedJob =
    (jobId ? jobs.find((job) => job.id === jobId) : null) ?? jobs[0] ?? null;
  const selectedJobId = selectedJob?.id ?? null;
  const selectedJobApplication = selectedJobId
    ? myApplications.find((app) => app.jobId === selectedJobId) ?? null
    : null;
  const hasAppliedToSelectedJob = selectedJobApplication !== null;
  const isAuthenticated = Boolean(userEmail || userName);
  const selectedApplicationPath = selectedJobId
    ? `/careers/apply?company=${companyId}&jobId=${selectedJobId}`
    : `/careers/apply?company=${companyId}`;
  const [showAuthCard, setShowAuthCard] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 relative overflow-hidden">
      {/* Wave decorations */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg
          viewBox="0 0 1440 320"
          className="absolute bottom-0 w-full opacity-[0.12]"
          preserveAspectRatio="none"
        >
          <path
            fill="white"
            d="M0,160L40,176C80,192,160,224,240,229.3C320,235,400,213,480,192C560,171,640,149,720,154.7C800,160,880,192,960,197.3C1040,203,1120,181,1200,170.7C1280,160,1360,160,1400,160L1440,160L1440,320L1400,320C1360,320,1280,320,1200,320C1120,320,1040,320,960,320C880,320,800,320,720,320C640,320,560,320,480,320C400,320,320,320,240,320C160,320,80,320,40,320L0,320Z"
          />
        </svg>
        <svg
          viewBox="0 0 1440 320"
          className="absolute bottom-0 w-full opacity-[0.08]"
          preserveAspectRatio="none"
        >
          <path
            fill="white"
            d="M0,128L50,149.3C100,171,200,213,300,218.7C400,224,500,192,600,181.3C700,171,800,181,900,192C1000,203,1100,213,1200,208C1300,203,1400,181,1440,170.7L1440,320L1400,320C1360,320,1280,320,1200,320C1100,320,1000,320,900,320C800,320,700,320,600,320C500,320,400,320,300,320C200,320,100,320,50,320L0,320Z"
          />
        </svg>
        <svg
          viewBox="0 0 1440 320"
          className="absolute bottom-0 w-full opacity-[0.05]"
          preserveAspectRatio="none"
        >
          <path
            fill="white"
            d="M0,96L60,112C120,128,240,160,360,165.3C480,171,600,149,720,144C840,139,960,149,1080,160C1200,171,1320,181,1380,186.7L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        {/* ── MARQUEE BAR ── */}
        <div className="relative overflow-hidden bg-brand-600 dark:bg-brand-900/50 backdrop-blur-md border-b border-brand-500/30 py-2.5 z-40 sticky top-0">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-700/50 via-transparent to-brand-700/50 pointer-events-none" />
          <div className="flex animate-marquee">
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="mx-12 flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-white"
              >
                <span className="bg-white text-brand-700 px-2 py-0.5 rounded-md text-[10px] shadow-sm animate-pulse border border-white/20">
                  Alert
                </span>
                <span className="flex items-center gap-2">
                  We are hiring!{" "}
                  <span className="text-brand-200">{companyName}</span> is now
                  accepting applications for Candidate Members
                </span>
                <div className="flex gap-1.5 ml-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-300/60" />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-300/40" />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-300/20" />
                </div>
              </span>
            ))}
          </div>
        </div>

        {/* ── HERO ── */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-16 sm:py-14">
          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-4 max-w-3xl">
            {companyName}
          </h1>

          <p className="text-white/50 text-sm sm:text-base max-w-xl mb-8">
            Explore open positions onboard and submit your application directly
            online. We&apos;re looking for dedicated Candidate members to join our fleet.
          </p>

          {/* Apply Now (Generic) — only if not applied and no jobs are available */}
          {!hasApplied && jobs?.length === 0 && (
            <a
              href={`/careers/apply?company=${companyId}`}
              className="inline-flex items-center gap-2 px-7 py-3 bg-white text-brand-700 hover:bg-brand-50 active:bg-brand-100 font-bold text-sm rounded-xl shadow-xl shadow-black/20 transition-all duration-150"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Apply General Form
            </a>
          )}

          {/* ── Jobs + Applications layout ── */}
          {selectedJob && jobs?.length > 0 && (
            <div className="w-full max-w-7xl mb-12 text-left flex flex-col lg:flex-row gap-6 items-start">
              {!isAuthenticated && showAuthCard ? (
                <div id="career-auth" className="mx-auto w-full max-w-[900px] scroll-mt-20">
                
                  <CareerAuthCard redirectPath={selectedApplicationPath} />
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <JobDetailCard
                    title={selectedJob.title}
                    description={selectedJob.description}
                    deadline={selectedJob.deadline}
                    location={selectedJob.location}
                    applicationLink={selectedJob.applicationLink}
                    companyId={companyId}
                    companyName={companyName}
                    companyLogo={companyLogo}
                    postedAt={selectedJob.postedAt}
                    hasApplied={hasAppliedToSelectedJob}
                    requiresAuth={!isAuthenticated}
                    onAuthRequired={() => setShowAuthCard(true)}
                  />
                </div>
              )}

              {/* ── My Applications — right side on lg, bottom on mobile ── */}
              {isAuthenticated && hasApplied && (
                <div className="lg:w-100 flex-shrink-0">
                  <div className="lg:sticky lg:top-16">
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
                      Your Recent Application
                    </p>
                    <div className="space-y-2">
                      {myApplications.slice(0, 3).map((app) => (
                        <MyApplicationCard
                          key={app._id}
                          appId={app._id}
                          companyId={companyId}
                          companyName={companyName}
                          companyLogo={companyLogo}
                          rank={app.rank}
                          positionApplied={app.positionApplied}
                          status={app.status}
                          createdAt={app.createdAt}
                          updatedAt={app.updatedAt}
                          jobIsAccepting={app.jobIsAccepting}
                          deadline={app.deadline}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── My Applications strip — shown when no jobs but has applied ── */}
          {!jobs?.length && hasApplied && (
            <div className="w-full max-w-2xl mt-8">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3 text-left">
                Your Recent Application
              </p>
              <div className="space-y-2">
                {myApplications.slice(0, 3).map((app) => (
                  <MyApplicationCard
                    key={app._id}
                    appId={app._id}
                    companyId={companyId}
                    companyName={companyName}
                    companyLogo={companyLogo}
                    rank={app.rank}
                    positionApplied={app.positionApplied}
                    status={app.status}
                    createdAt={app.createdAt}
                    updatedAt={app.updatedAt}
                    jobIsAccepting={app.jobIsAccepting}
                    deadline={app.deadline}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
