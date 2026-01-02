"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function SessionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    // 🔴 User deleted / token invalid
    if (status === "unauthenticated") {
      signOut({ callbackUrl: "/signin" });
    }
  }, [status]);

  return <>{children}</>;
}