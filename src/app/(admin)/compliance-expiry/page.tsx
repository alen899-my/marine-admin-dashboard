// src/app/(admin)/compliance-expiry/page.tsx
import { Metadata } from "next";
import { auth } from "@/auth";
import {getComplianceExpiryCrews} from "@/lib/services/compilanceService"
import {getAllCompaniesForDropdown} from "@/lib/services/applicationService"
import { redirect } from "next/navigation";
import ComplianceExpiryPageClient from "./ComplianceExpiryPageClient";
import ComplianceExpiryTable from "./ComplianceExpiryTable";

export const metadata: Metadata = {
  title: "Compliance Expiry | Parkora Falcon",
  description: "Track crew document expiry alerts.",
};

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}

export default async function ComplianceExpiryPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const userRole = session.user.role?.toLowerCase() || "";
  const isSuperAdmin = userRole === "super-admin" || userRole === "super_admin";
  const userCompanyId = session.user.company?.id;

  if (!isSuperAdmin && !userCompanyId) {
    return (
      <div className="p-8 text-center text-red-500 font-semibold bg-red-50 rounded-lg border border-red-200 mt-6 mx-4">
        You do not have a company assigned. Access denied to Compliance module.
      </div>
    );
  }

  const resolvedParams = (await searchParams) ?? {};
  const page = Number(resolvedParams.page) || 1;
  const limit = 20;
  const search = resolvedParams.search || "";
  const expiryType = resolvedParams.expiryType || "all";
  const daysAhead = Number(resolvedParams.daysAhead) || 90;
  const companyId = resolvedParams.companyId || "";

  const [{ data, pagination }, companies] = await Promise.all([
    getComplianceExpiryCrews({
      page,
      limit,
      search,
      expiryType,
      daysAhead,
      companyId,
      user: session.user,
    }),
    getAllCompaniesForDropdown(),
  ]);

  return (
    <ComplianceExpiryPageClient
      totalCount={pagination.total}
      isSuperAdmin={isSuperAdmin}
      userCompanyId={userCompanyId}
      companies={companies}
    >
      <ComplianceExpiryTable
        data={data}
        pagination={{ page, limit, totalPages: pagination.totalPages }}
        isSuperAdmin={isSuperAdmin}
      />
    </ComplianceExpiryPageClient>
  );
}