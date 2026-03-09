import Image from "next/image";
import Link from "next/link";
import JobCard from "./Jobcard";

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

interface Props {
  jobs: JobItem[];
}

export default function CompaniesTable({ jobs }: Props) {
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

      <div className="relative z-10 flex flex-col flex-1 px-4 sm:px-6 py-10">
        <div className="max-w-4xl mx-auto w-full">

          {/* Page heading */}
          <div className="mb-8 text-center">
            <p className="text-brand-300 text-xs font-semibold uppercase tracking-[0.2em] mb-2">
              Crew Recruitment
            </p>
            <h1 className="text-2xl sm:text-4xl font-bold text-white leading-tight mb-2">
              Current Opportunities
            </h1>
            <p className="text-white/50 text-sm max-w-md mx-auto">
              Browse companies currently accepting crew applications and apply directly online.
            </p>
          </div>

          {/* Empty state */}
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-white/70 mb-1">No job openings right now</p>
              <p className="text-xs text-white/40 max-w-xs">
                There are no active job postings at this time. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <JobCard key={job._id} {...job} />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}