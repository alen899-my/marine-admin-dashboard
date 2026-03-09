"use client";
import PublicUserDropdown from "@/components/header/PublicUserDropdown";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { useSession } from "next-auth/react";

const NAV_ITEMS = [

  { id: "applications", label: "My Applications", href: "/careers/applications" },
];

interface PublicHeaderProps {
  companyLogo?: string | null;
}

const PublicHeader: React.FC<PublicHeaderProps> = ({ companyLogo }) => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { status } = useSession();

  return (
    <header className="sticky top-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-[99999]">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">

        {/* ── LEFT: Logo ── */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <Image
            priority
            className="dark:hidden"
            src="/images/logo/b.png"
            alt="Logo"
            width={140}
            height={44}
          />
          <Image
            priority
            className="hidden dark:block"
            src="/images/logo/parkora_logo_dark.png"
            alt="Logo"
            width={140}
            height={44}
          />
        </Link>

        {/* ── RIGHT: Desktop nav + user ── */}
        <div className="hidden lg:flex items-center gap-2">
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.includes(item.id);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${isActive
                      ? "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                    }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-2 flex items-center">
            {status === "loading" ? (
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            ) : status === "authenticated" ? (
              <PublicUserDropdown />
            ) : (
              <Link
                href={`/signin?redirect=${encodeURIComponent(pathname)}`}
                className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* ── RIGHT: Mobile — user + hamburger ── */}
        <div className="flex lg:hidden items-center gap-2">
          {status === "loading" ? (
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ) : status === "authenticated" ? (
            <PublicUserDropdown />
          ) : null}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {/* ── MOBILE FULLSCREEN MENU ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-[99998] bg-white dark:bg-gray-900 flex flex-col">
          <nav className="flex flex-col px-4 py-6 gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.includes(item.id);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl text-base font-semibold transition-colors ${isActive
                      ? "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                    }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Mobile Login fallback when unauthenticated */}
            {status === "unauthenticated" && (
              <Link
                href={`/signin?redirect=${encodeURIComponent(pathname)}`}
                onClick={() => setMobileOpen(false)}
                className="mt-4 mx-4 py-3 text-center rounded-xl text-base font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default PublicHeader;