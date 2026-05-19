import React from "react";

interface CareerPortalShellProps {
  title?: string;
  description?: string;
  marqueeCompanyNames?: string[];
  children: React.ReactNode;
}

export default function CareerPortalShell({
  title = "Parkora Careers",
  description = "Explore open positions onboard and submit your application directly online.",
  marqueeCompanyNames = [],
  children,
}: CareerPortalShellProps) {
  const companyNames = marqueeCompanyNames.length > 0 ? marqueeCompanyNames : ["All Companies"];
  const marqueeItems = Array.from(
    { length: Math.max(companyNames.length * 2, 4) },
    (_, index) => companyNames[index % companyNames.length],
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 relative overflow-hidden">
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
        <div className="relative overflow-hidden bg-brand-600 dark:bg-brand-900/50 backdrop-blur-md border-b border-brand-500/30 py-2.5 z-40">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-700/50 via-transparent to-brand-700/50 pointer-events-none" />
          <div className="flex animate-marquee">
            {marqueeItems.map((companyName, index) => (
              <span
                key={`${companyName}-${index}`}
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

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:py-14">
          <h1 className="mb-4 max-w-3xl text-3xl font-bold leading-tight text-white sm:text-5xl">
            {title}
          </h1>

          <p className="mb-8 max-w-xl text-sm text-white/50 sm:text-base">
            {description}
          </p>

          <div className="w-full max-w-[900px] text-left">{children}</div>
        </div>
      </div>
    </div>
  );
}
