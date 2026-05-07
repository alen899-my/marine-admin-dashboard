"use server";

import { auth } from "@/auth";
import { getComplianceExpiryCount } from "@/lib/services/compilanceService";

export async function fetchComplianceExpiryCount(daysAhead: number = 90) {
  const session = await auth();
  
  if (!session?.user) {
    return 0;
  }

  const userCompanyId = session.user.company?.id;

  const count = await getComplianceExpiryCount({
    daysAhead,
    companyId: userCompanyId,
    user: session.user,
  });

  return count;
}
