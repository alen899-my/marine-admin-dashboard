"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import SessionRefreshProvider from "@/providers/SessionRefreshProvider";
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionRefreshProvider />
      <ThemeProvider>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}