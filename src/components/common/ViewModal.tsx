"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

export default function ViewModal({
  isOpen,
  onClose,
  title,
  headerRight,
  children,
}: ViewModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={`
        w-full
        max-w-[95vw]
        sm:max-w-[90vw]
        md:max-w-[720px]
        lg:max-w-[900px]
        p-4
        sm:p-6
        lg:p-8
      `}
    >
      {/* HEADER SECTION */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h4 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h4>
        
        {/* RIGHT SIDE SECTION */}
        {headerRight && (
          <div className="flex items-center gap-2 me-15">
            {headerRight}
          </div>
        )}
      </div>


      {/* BODY */}
      <div
        className="
          max-h-[75vh]
          overflow-y-auto
          rounded-xl
          border
          border-gray-200
          bg-gray-50
          p-4
          sm:p-5
          text-sm
          leading-6
          text-gray-700
          dark:border-white/10
          dark:bg-gray-800
          dark:text-gray-200
        "
      >
        {children}
      </div>
    </Modal>
  );
}
