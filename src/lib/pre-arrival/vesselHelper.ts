// src/lib/vesselHelper.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Returns a filter object for Mongoose queries based on the user's role and company.
 * Handles Super Admin (all or filtered by company) vs. Admin (restricted to own company).
 */
export async function getVesselFilterByRole() {
  const session = await auth();
  
  if (!session || !session.user) {
    return { error: "Unauthorized", status: 401 };
  }

  const { user } = session;
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = user.company?.id;

  // Initialize query to exclude soft-deleted records
  const query: any = { deletedAt: null };

  if (isSuperAdmin) {
    // Super Admin can see everything by default. 
    // If a specific company filter is needed, it can be added to this query object later.
  } else {
    // Regular Admin: Restricted to their own company
    if (!userCompanyId) {
      return { 
        error: "Access denied: No company assigned to your profile.", 
        status: 403 
      };
    }
    query.company = userCompanyId;
  }

  return { query, ok: true };
}