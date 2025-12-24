"use client";

import { useSession } from "next-auth/react";

export function useAuthorization() {
  const { data: session, status } = useSession();

  const user = session?.user;

  const role = user?.role; // string: "super-admin", "admin", etc
  const permissions: string[] = user?.permissions ?? [];

  const isSuperAdmin = role === "super-admin";
  const isAdmin = role === "admin";

  const can = (permission: string) => {
    if (status !== "authenticated") return false;

    // ✅ SUPER ADMIN BYPASS (NO PERMISSION CHECK)
    if (isSuperAdmin) return true;

 

    return permissions.includes(permission);
  };

  const canAny = (perms: string[]) => {
    if (status !== "authenticated") return false;

    // ✅ SUPER ADMIN BYPASS
    if (isSuperAdmin) return true;



    return perms.some(p => permissions.includes(p));
  };

  return {
    can,
    canAny,

    isSuperAdmin,
    isAdmin,

    isReady: status !== "loading",
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    user,
  };
}
