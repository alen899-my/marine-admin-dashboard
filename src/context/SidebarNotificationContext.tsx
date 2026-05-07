"use client";

import { fetchComplianceExpiryCount } from "@/actions/compliance";
import { fetchCandidateCount, fetchContractCount, fetchOnboardingCount } from "@/actions/counts";
import { useAuthorization } from "@/hooks/useAuthorization";
import { usePathname } from "next/navigation";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type SidebarNotificationCounts = {
  complianceExpiry: number;
  contracts: number;
  onboarding: number;
  candidateProfiles: number;
};

type SidebarNotificationContextValue = {
  counts: SidebarNotificationCounts;
  refreshCounts: () => Promise<void>;
};

const DEFAULT_COUNTS: SidebarNotificationCounts = {
  complianceExpiry: 0,
  contracts: 0,
  onboarding: 0,
  candidateProfiles: 0,
};

const SidebarNotificationContext =
  createContext<SidebarNotificationContextValue | null>(null);

export function SidebarNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { can, isReady, isAuthenticated } = useAuthorization();
  const [counts, setCounts] = useState<SidebarNotificationCounts>(DEFAULT_COUNTS);
  const requestIdRef = useRef(0);

  const refreshCounts = useCallback(async () => {
    if (!isReady || !isAuthenticated) {
      setCounts(DEFAULT_COUNTS);
      return;
    }

    const requestId = ++requestIdRef.current;
    try {
      const [complianceExpiry, contracts, onboarding, candidateProfiles] = await Promise.all([
        can("compilance.view") ? fetchComplianceExpiryCount(90) : 0,
        can("contracts.view") ? fetchContractCount() : 0,
        can("onboarding.view") ? fetchOnboardingCount() : 0,
        can("candidates.view") ? fetchCandidateCount() : 0,
      ]);

      if (requestId !== requestIdRef.current) return;

      setCounts({
        complianceExpiry,
        contracts,
        onboarding,
        candidateProfiles,
      });
    } catch {
      if (requestId !== requestIdRef.current) return;
      setCounts(DEFAULT_COUNTS);
    }
  }, [can, isAuthenticated, isReady]);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts, pathname]);

  const value = useMemo(
    () => ({
      counts,
      refreshCounts,
    }),
    [counts, refreshCounts],
  );

  return (
    <SidebarNotificationContext.Provider value={value}>
      {children}
    </SidebarNotificationContext.Provider>
  );
}

export function useSidebarNotifications() {
  const context = useContext(SidebarNotificationContext);

  if (!context) {
    throw new Error(
      "useSidebarNotifications must be used within a SidebarNotificationProvider",
    );
  }

  return context;
}

export function useOptionalSidebarNotifications() {
  return useContext(SidebarNotificationContext);
}
