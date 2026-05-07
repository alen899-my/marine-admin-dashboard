"use server";

import { auth } from "@/auth";
import { getCandidateCount, getContractCount, getOnboardingCount } from "@/lib/services/applicationService";

export async function fetchContractCount() {
  const session = await auth();
  
  if (!session?.user) {
    return 0;
  }

  const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
  const userCompanyId = session.user.company?.id;

  const count = await getContractCount({
    companyId: isSuperAdmin ? undefined : userCompanyId,
    user: session.user,
  });

  return count;
}

export async function fetchOnboardingCount() {
  const session = await auth();
  
  if (!session?.user) {
    return 0;
  }

  const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
  const userCompanyId = session.user.company?.id;

  const count = await getOnboardingCount({
    companyId: isSuperAdmin ? undefined : userCompanyId,
    user: session.user,
  });

  return count;
}

export async function fetchCandidateCount() {
  const session = await auth();
  
  if (!session?.user) {
    return 0;
  }

  const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
  const userCompanyId = session.user.company?.id;

  const count = await getCandidateCount({
    companyId: isSuperAdmin ? undefined : userCompanyId,
    user: session.user,
  });

  return count;
}