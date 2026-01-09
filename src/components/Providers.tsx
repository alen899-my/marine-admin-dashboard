"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Session } from "next-auth"; // Import Session type

// Update props to accept 'session'
export function Providers({ 
  children, 
  session 
}: { 
  children: React.ReactNode; 
  session: Session | null 
}) {
  return (
    // Pass the session here so it doesn't have to fetch it on mount
    <SessionProvider session={session} refetchInterval={120}>
      <ThemeProvider>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}