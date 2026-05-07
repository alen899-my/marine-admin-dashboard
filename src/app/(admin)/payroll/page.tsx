import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { getPayrollDashboardData } from "@/lib/services/payrollService";
import { getSettings } from "@/lib/systemSettings.server";
import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";
import PayrollPageClient from "./PayrollPageClient";

export const metadata: Metadata = {
  title: "Payroll Management | Parkora Falcon",
  description:
    "Process crew payroll with contract wages, salary head allowances, and workflow approvals.",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function PayrollManagementPage({
  searchParams,
}: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const authz = await authorizeRequest("payroll.view");
  if (!authz.ok) {
    return <div>Access Denied</div>;
  }

  const resolvedParams = await searchParams;
  const data = await getPayrollDashboardData({
    user: session.user,
    salaryHeadId: resolvedParams.salaryHeadId,
    payrollDate: resolvedParams.payrollDate,
    search: resolvedParams.search,
    status: resolvedParams.status,
    companyId: resolvedParams.companyId,
    rank: resolvedParams.rank,
    vessel: resolvedParams.vessel,
    payscaleStatus: resolvedParams.payscaleStatus,
    salaryHeadState: resolvedParams.salaryHeadState,
  });
  const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
  const settingsCompanyId = isSuperAdmin
    ? resolvedParams.companyId
    : session.user.company?.id;
  const settings = settingsCompanyId
    ? await getSettings({ companyId: settingsCompanyId })
    : await getSettings();

  // Get company currency from session
  let currencyCode = "USD"; // Default currency
  const companyId = session.user.company?.id;
  if (companyId) {
    await dbConnect();
    const company = await Company.findById(companyId).select("currency").lean();
    if (company?.currency) {
      currencyCode = company.currency;
    }
  }

  return (
    <PayrollPageClient
      {...data}
      payrollCaptainOnlyVerification={settings.captainOnlyVerification}
      currencyCode={currencyCode}
      currencySettings={settings ? {
        currencyPosition: settings.currencyPosition as "left" | "right",
        currencyFormatType: settings.currencyFormatType as "symbol" | "code",
        currencySpace: settings.currencySpace,
      } : undefined}
    />
  );
}
