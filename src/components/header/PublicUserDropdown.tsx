"use client";
import { signOut } from "next-auth/react";
import { LogOut, UserCog, Info } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useUser } from "@/context/UserContext"; // Import the context hook
import { useModal } from "../../hooks/useModal";
import EditProfileModal from "@/components/profile/EditProfileModal";

export default function PublicUserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { dbUser, setDbUser } = useUser(); // Use central state instead of local fetch
  const { isOpen: isModalOpen, openModal, closeModal } = useModal();

  // Fallbacks for data
  const fullName = dbUser?.fullName || "User";
  const email = dbUser?.email || "";
  const profilePicture = dbUser?.profilePicture;
  const roleName = dbUser?.role?.name || "Applicant";

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="relative">
      {/* Trigger */}
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
       className="absolute right-0 mt-3 w-[280px] z-[99999]"
      >
        <div className="relative">
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-brand-400/30 via-transparent to-brand-600/20 dark:from-brand-500/20 dark:to-brand-700/10 blur-sm" />

          <div className="relative rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-theme-xl overflow-hidden">

            {/* Header (Matching UserDropdown Hero style) */}
            <div className="relative px-5 pt-5 pb-10 bg-gradient-to-br from-brand-500 to-brand-700 overflow-hidden">
              <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-white/10" />
              <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5" />

              <div className="relative flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white text-base leading-tight truncate mb-1">
                    {fullName}
                  </p>
                  <p className="text-brand-100 text-[11px] truncate mb-2">{email}</p>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                      {roleName}
                    </span>
                  </span>
                </div>

                <div className="flex-shrink-0 h-12 w-12 rounded-2xl overflow-hidden border-2 border-white/40 shadow-theme-md bg-brand-400">
                  {profilePicture ? (
                    <Image width={48} height={48} src={profilePicture} alt="User" className="object-cover h-full w-full" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="px-3 py-2 space-y-0.5">
              <DropdownItem
                onItemClick={() => { closeDropdown(); openModal(); }}
                tag="button"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-theme-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all duration-150 group"
              >
                <UserCog className="w-4 h-4 flex-shrink-0 text-gray-400 group-hover:text-brand-500 transition-colors" />
                <span>Edit Profile</span>
              </DropdownItem>

              <DropdownItem
                tag="a"
                href="/careers/help"
                onItemClick={closeDropdown}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-theme-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all duration-150 group"
              >
                <Info className="w-4 h-4 flex-shrink-0 text-gray-400 group-hover:text-brand-500 transition-colors" />
                <span>Help Center</span>
              </DropdownItem>
            </div>

            {/* Sign Out */}
            <div className="mx-3 mb-3">
              <button
                onClick={() => {
                  closeDropdown();
                  signOut({ callbackUrl: "/signin" });
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-theme-sm font-medium text-error-600 dark:text-error-400 border border-error-100 dark:border-error-500/20 bg-error-50 dark:bg-error-500/10 hover:bg-error-100 transition-all duration-150"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </Dropdown>

      {/* Modal - Crucial for Edit functionality */}
      <EditProfileModal
        isOpen={isModalOpen}
        onClose={closeModal}
        initialData={dbUser}
        onSuccess={(updated) => setDbUser(updated)}
      />
    </div>
  );
}