import React from "react";
import { UserProvider } from "@/context/UserContext";

export default function CareerLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <div className="min-h-screen flex flex-col">
        {children}
      </div>
    </UserProvider>
  );
}