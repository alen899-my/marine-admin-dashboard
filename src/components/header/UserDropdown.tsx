"use client";
import EditProfileModal from "@/components/profile/EditProfileModal";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import Badge from "../ui/badge/Badge";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import Link from "next/link";
import { UserCog, Info, LogOut } from "lucide-react"; 
export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);
  const { isOpen: isModalOpen, openModal, closeModal } = useModal();

  const { data: session } = useSession();
  const user = session?.user;

  useEffect(() => {
    async function fetchUserData() {
      try {
        const res = await fetch("/api/users/profile");
        if (res.ok) {
          const data = await res.json();
          setDbUser(data);
        }
      } catch (error) {
        console.error("Failed to fetch user data", error);
      }
    }

    // ONLY fetch if we have a session AND we haven't loaded dbUser yet
    if (session && !dbUser) {
      fetchUserData();
    }
  }, [session, dbUser]); // Added dbUser to dependencies

  const fullName = dbUser?.fullName || user?.fullName || "User";
  const email = dbUser?.email || user?.email || "";
  const profilePicture = dbUser?.profilePicture || user?.profilePicture;
  const roleName = dbUser?.role?.name;
  const companyName = dbUser?.company?.name;

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

return (
    <div className="relative">
      {/* Trigger — minimal avatar-only pill */}
      <button
        onClick={toggleDropdown}
        className={`
          relative flex items-center gap-0 p-0.5 rounded-full
          border-2 transition-all duration-300 dropdown-toggle
          ${isOpen
            ? "border-brand-500 dark:border-brand-400"
            : "border-transparent hover:border-brand-200 dark:hover:border-brand-800"
          }
        `}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden bg-brand-100 dark:bg-brand-500/20">
          {profilePicture ? (
            <Image
              width={40}
              height={40}
              src={profilePicture}
              alt="User"
              className="object-cover h-full w-full"
              unoptimized
            />
          ) : (
            <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          )}
        </span>
      
      </button>

      {/* Dropdown Panel */}
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-3 w-[300px] z-50"
      >
        {/* Outer glow wrapper */}
        <div className="relative">
          {/* Subtle glow behind panel */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-brand-400/30 via-transparent to-brand-600/20 dark:from-brand-500/20 dark:to-brand-700/10 blur-sm" />

          <div className="relative rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-theme-xl overflow-hidden">

            {/* Hero header — full bleed brand bg */}
            <div className="relative px-5 pt-5 pb-14 bg-gradient-to-br from-brand-500 to-brand-700 overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-white/10" />
              <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5" />
              <div className="absolute top-2 right-16 h-10 w-10 rounded-full bg-white/5" />

              <div className="relative flex items-start justify-between">
                <div className="min-w-0 flex-1 pr-3">
                  <p className="font-semibold text-white text-base leading-tight truncate mb-1">
                    {fullName}
                  </p>
                  <p className="text-brand-100 text-theme-xs truncate mb-3">
                    {email}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      <span className="text-[11px] font-semibold text-white uppercase tracking-wider">
                        {roleName}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Avatar — floats over the fold */}
                <div className="flex-shrink-0 h-14 w-14 rounded-2xl overflow-hidden border-2 border-white/40 shadow-theme-md bg-brand-400">
                  {profilePicture ? (
                    <Image
                      width={56}
                      height={56}
                      src={profilePicture}
                      alt="User"
                      className="object-cover h-full w-full"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Company chip — overlaps the fold */}
            <div className="relative -mt-5 mx-5 mb-3">
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-theme-sm">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
                  <svg className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="text-theme-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                  {companyName}
                </span>
             
              </div>
            </div>

            {/* Divider */}
            <div className="mx-5 border-t border-gray-100 dark:border-gray-800 mb-2" />

            {/* Menu Items */}
            <div className="px-3 pb-2 space-y-0.5">
              <DropdownItem
                onItemClick={() => { closeDropdown(); openModal(); }}
                tag="button"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-theme-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all duration-150 group"
              >
                <UserCog className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors" />
                <span>Edit Profile</span>
                <svg className="ml-auto w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-brand-400 dark:group-hover:text-brand-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </DropdownItem>

              <DropdownItem
                tag="a"
                href="/settings/about"
                onItemClick={closeDropdown}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-theme-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all duration-150 group"
              >
                <Info className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors" />
                <span>System Info</span>
                <svg className="ml-auto w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-brand-400 dark:group-hover:text-brand-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </DropdownItem>
            </div>

            {/* Sign Out — full-width bottom bar */}
            <div className="mx-3 mb-3 mt-1">
              <button
                onClick={() => { closeDropdown(); signOut({ callbackUrl: "/signin" }); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-theme-sm font-medium text-error-600 dark:text-error-400 border border-error-100 dark:border-error-500/20 bg-error-50 dark:bg-error-500/10 hover:bg-error-100 dark:hover:bg-error-500/20 hover:border-error-200 dark:hover:border-error-500/30 transition-all duration-150 group"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>

          </div>
        </div>
      </Dropdown>

      {/* Modal */}
      <EditProfileModal
        isOpen={isModalOpen}
        onClose={closeModal}
        initialData={dbUser}
        onSuccess={(updated) => setDbUser(updated)}
      />
    </div>
  );
}
