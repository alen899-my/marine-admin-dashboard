"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <Backdrop />
      
      {/* 1. flex-1: Fills remaining space.
          2. min-w-0: CRITICAL. This allows the flex child to shrink smaller than its content.
          3. overflow-hidden: Prevents child elements from leaking outside.
      */}
      <div
        className={`flex-1 min-w-0 relative flex flex-col transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        <AppHeader />
        
        {/* Page Content: 
            Added 'w-full' and 'max-w-full' to ensure the inner container 
            never exceeds the calculated width of the flex parent.
        */}
        <main className="flex-1 w-full max-w-full p-4 mx-auto md:p-6 overflow-y-auto">
          <div className="  w-full">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}