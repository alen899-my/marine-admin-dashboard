"use client";


import MyApplicationCard from "@/components/Jobs/MyApplicationCard";

// ─── Types ────────────────────────────────────────────────────────────────────

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
}

interface CareersLayoutProps {
  companyId: string;
  companyName: string;
  companyLogo?: string;
  jobs: JobOpening[];
  userEmail?: string;
  userName?: string;
  myApplications?: MyApplication[];
}



export default function CareersLayout({
  companyId,
  companyName,
  companyLogo,
  jobs,
  userEmail,
  userName,
  myApplications = [],
}: CareersLayoutProps) {



  const latestApplication = myApplications[0] ?? null;
  const hasApplied = latestApplication !== null;


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 relative overflow-hidden">

      {/* Wave decorations */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full opacity-[0.12]" preserveAspectRatio="none">
          <path fill="white" d="M0,160L40,176C80,192,160,224,240,229.3C320,235,400,213,480,192C560,171,640,149,720,154.7C800,160,880,192,960,197.3C1040,203,1120,181,1200,170.7C1280,160,1360,160,1400,160L1440,160L1440,320L1400,320C1360,320,1280,320,1200,320C1120,320,1040,320,960,320C880,320,800,320,720,320C640,320,560,320,480,320C400,320,320,320,240,320C160,320,80,320,40,320L0,320Z" />
        </svg>
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full opacity-[0.08]" preserveAspectRatio="none">
          <path fill="white" d="M0,128L50,149.3C100,171,200,213,300,218.7C400,224,500,192,600,181.3C700,171,800,181,900,192C1000,203,1100,213,1200,208C1300,203,1400,181,1440,170.7L1440,320L1400,320C1360,320,1280,320,1200,320C1100,320,1000,320,900,320C800,320,700,320,600,320C500,320,400,320,300,320C200,320,100,320,50,320L0,320Z" />
        </svg>
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full opacity-[0.05]" preserveAspectRatio="none">
          <path fill="white" d="M0,96L60,112C120,128,240,160,360,165.3C480,171,600,149,720,144C840,139,960,149,1080,160C1200,171,1320,181,1380,186.7L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col flex-1">

        {/* ── MARQUEE BAR ── */}
        <div className="relative overflow-hidden bg-brand-600 dark:bg-brand-900/50 backdrop-blur-md border-b border-brand-500/30 py-2.5 z-40">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-700/50 via-transparent to-brand-700/50 pointer-events-none" />
          <div className="flex animate-marquee">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className="mx-12 flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-white">
                <span className="bg-white text-brand-700 px-2 py-0.5 rounded-md text-[10px] shadow-sm animate-pulse border border-white/20">
                  Alert
                </span>
                <span className="flex items-center gap-2">
                  We are hiring! <span className="text-brand-200">{companyName}</span> is now accepting applications for Crew Members
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
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-16 sm:py-24">

          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-4 max-w-3xl">
            {companyName}
          </h1>

          <p className="text-white/50 text-sm sm:text-base max-w-xl mb-8">
            Explore open positions onboard and submit your application directly online. We're looking for dedicated crew members to join our fleet.
          </p>



          {/* Apply Now (Generic) — only if not applied and no jobs are available */}
          {!hasApplied && jobs?.length === 0 && (
            <a
              href={`/careers/apply?company=${companyId}`}
              className="inline-flex items-center gap-2 px-7 py-3 bg-white text-brand-700 hover:bg-brand-50 active:bg-brand-100 font-bold text-sm rounded-xl shadow-xl shadow-black/20 transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Apply General Form
            </a>
          )}

          {/* ── Active Jobs (Job Postings) ── */}
          {jobs?.length > 0 && (
            <div className="w-full max-w-5xl mt-16 mb-12 text-left">
              <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Open Positions
                </h2>
                <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs font-medium backdrop-blur-sm border border-white/5">
                  {jobs.length} {jobs.length === 1 ? 'Opening' : 'Openings'}
                </span>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="group bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 hover:border-brand-400/50 hover:shadow-brand-500/10 transition-all duration-300 flex flex-col"
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors duration-200">
                          {job.title}
                        </h3>
                        {job.deadline && (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Expiring
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 mb-5">
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {job.location || "Multiple Locations"}
                        </div>
                        {job.deadline && (
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Due {new Date(job.deadline).toLocaleDateString("en-GB", { day: 'numeric', month: 'short' })}
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-4 leading-relaxed mb-6 font-medium">
                        {job.description || "Join our team in this exciting new opportunity. We're looking for passionate individuals to help us build the future."}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50">
                      {(!hasApplied) ? (
                        <a
                          href={job.applicationLink || `/careers/apply?company=${companyId}`}
                          className="group/btn flex items-center justify-center gap-2 w-full py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-md shadow-brand-500/20 active:transform active:scale-[0.98]"
                        >
                          Apply for Position
                          <svg className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </a>
                      ) : (
                        <div className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 text-sm font-bold rounded-xl cursor-not-allowed border border-gray-200 dark:border-gray-700">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Already Applied
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── My Applications strip (shown when user has applied) ── */}
          {hasApplied && (
            <div className="w-full max-w-2xl mt-8">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3 text-left">
                Your Recent Application
              </p>
              <div className="space-y-2">
                {myApplications.map((app) => (
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