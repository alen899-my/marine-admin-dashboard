import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { getSettings } from "@/lib/systemSettings.server";
import { getCompanies } from "@/lib/services/companyService";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "Settings | Parkora Falcon",
  description: "Manage system settings and configurations.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const authz = await authorizeRequest("settings.manage");
  if (!authz.ok) {
    return <div>Access Denied</div>;
  }

  const user = session.user;
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = user.company?.id;

  // Redirect if no company assigned
  if (!userCompanyId && !isSuperAdmin) {
    return <div>No company assigned. Please contact administrator.</div>;
  }

  // Get companies for super admin
  let companies: { value: string; label: string }[] = [];
  if (isSuperAdmin) {
    const companiesResult = await getCompanies({
      user,
      limit: 100,
      status: "all",
    });
    companies = companiesResult.data.map((c: any) => ({
      value: c._id,
      label: c.name,
    }));

    // If no companies available, show error
    if (companies.length === 0) {
      return <div>No companies found. Please create a company first.</div>;
    }
  }

  // Get initial settings for user's company
  // For super admin, default to first company; for regular user, use their company
  const defaultCompanyId = isSuperAdmin ? companies[0]?.value : userCompanyId;
  const [initialSettings, globalSettings] = await Promise.all([
    getSettings({ companyId: defaultCompanyId }),
    isSuperAdmin ? getSettings() : Promise.resolve(null),
  ]);

  return (
    <SettingsClient
      initialSettings={initialSettings}
      globalSettings={globalSettings ?? undefined}
      isSuperAdmin={isSuperAdmin}
      companies={companies}
      userCompanyId={userCompanyId}
      defaultCompanyId={defaultCompanyId}
    />
  );
}
