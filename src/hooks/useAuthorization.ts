"use client";

import { useSession } from "next-auth/react";
import { useCallback, useMemo } from "react";

export function useAuthorization() {
  const { data: session, status } = useSession();

  const user = session?.user;

  const role = user?.role; // "super-admin", "admin", etc
  const permissions = user?.permissions ?? [];
  const stablePermissions = useMemo(() => permissions, [JSON.stringify(permissions)]);

  const isSuperAdmin = role === "super-admin";
  const isAdmin = role === "admin";

  //  Convert permissions to Set for O(1) lookup
  const permissionSet = useMemo(() => {
    return new Set(stablePermissions);
  }, [stablePermissions]);

  //  Memoized permission check
  const can = useCallback(
    (permission: string) => {
      if (status !== "authenticated") return false;

      //  SUPER ADMIN BYPASS (NO PERMISSION CHECK)
      if (isSuperAdmin) return true;

      return permissionSet.has(permission);
    },
    [status, isSuperAdmin, permissionSet],
  );

  //  Memoized multi-permission check
  const canAny = useCallback(
    (perms: string[]) => {
      if (status !== "authenticated") return false;

      //  SUPER ADMIN BYPASS
      if (isSuperAdmin) return true;

      return perms.some((p) => permissionSet.has(p));
    },
    [status, isSuperAdmin, permissionSet],
  );

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
