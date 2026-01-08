import GridShape from "@/components/common/GridShape";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "Access Denied | RBAC Dashboard",
  description: "You do not have permission to access this resource.",
};

export default function Error403() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden z-1">
      <GridShape />
      <div className="mx-auto w-full max-w-[242px] text-center sm:max-w-[500px]">
        <h1 className="mb-8 font-bold text-gray-800 text-title-md dark:text-white/90 xl:text-title-2xl">
          ACCESS DENIED
        </h1>

        {/* Note: You can replace these paths with specific 403/Locked SVGs if you have them */}
        <Image
          src="/images/error/403.svg" 
          alt="403 Forbidden"
          className="dark:hidden mx-auto"
          width={350}
          height={200}
        />
        <Image
          src="/images/error/403-dark.svg"
          alt="403 Forbidden"
          className="hidden dark:block mx-auto"
          width={350}
          height={200}
        />

        <div className="mt-10">
          <h2 className="mb-3 text-xl font-semibold text-gray-800 dark:text-white/90">
            Permission Required
          </h2>
          <p className="mb-8 text-base text-gray-700 dark:text-gray-400 sm:text-lg">
            Sorry, you don't have the necessary privileges to view this page. 
            Please contact your administrator if you believe this is an error.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 transition-colors"
          >
            Back to Home
          </Link>
         
        </div>
      </div>

      {/* Footer */}
      <p className="absolute text-sm text-center text-gray-500 -translate-x-1/2 bottom-6 left-1/2 dark:text-gray-400">
        &copy; {new Date().getFullYear()} - TailAdmin
      </p>
    </div>
  );
}