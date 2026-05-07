"use client";

import { ImpersonationBanner } from "@/components/common/ImpersonationBanner";
import {
  SidebarNotificationProvider,
  useSidebarNotifications,
} from "@/context/SidebarNotificationContext";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";
import TimezoneProvider from "@/components/TimezoneProvider";

function AdminLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { counts } = useSidebarNotifications();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      <TimezoneProvider />
      <AppSidebar notificationCounts={counts} />
      <Backdrop />
      <div
        className={`flex-1 min-w-0 relative flex flex-col transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        <AppHeader />
        <ImpersonationBanner />
        <main className="flex-1 w-full max-w-full p-4 mx-auto md:p-6 overflow-y-auto">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarNotificationProvider>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </SidebarNotificationProvider>
  );
}
