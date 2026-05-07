import { auth } from "@/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { getSalaryHeads } from "@/lib/services/salaryHeadService";
import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";
import SalaryHeadPageClient from "./SalaryHeadPageClient";
import SalaryHeadTable from "./SalaryHeadTable";

export const metadata: Metadata = {
  title: "Salary Head Management | Parkora Falcon",
  description: "Manage salary head information and wage structures.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function SalaryHeadManagementPage({
  searchParams,
}: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const authz = await authorizeRequest("salary.head.view");
  if (!authz.ok) return <div>Access Denied</div>;

  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;
  const limit = Number(resolvedParams.limit) || 20;
  const search = resolvedParams.search || "";
  const status = resolvedParams.status || "all";
  const companyIdFilter = resolvedParams.companyId || "";

  const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
  const currentUserCompanyId = session.user.company?.id;

  const { data, pagination } = await getSalaryHeads({
    page,
    limit,
    search,
    status,
    companyId: isSuperAdmin ? companyIdFilter : currentUserCompanyId,
  });

  let companyOptions: { value: string; label: string }[] = [];
  if (isSuperAdmin) {
    await dbConnect();
    const companies = await Company.find({ deletedAt: null })
      .select("name")
      .sort({ name: 1 })
      .lean();
    companyOptions = companies.map((c) => ({
      value: String(c._id),
      label: String(c.name),
    }));
  }

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
    <SalaryHeadPageClient
      totalCount={pagination.total}
      currencyCode={currencyCode}
      isSuperAdmin={isSuperAdmin}
      companyOptions={companyOptions}
      companyId={isSuperAdmin ? companyIdFilter : currentUserCompanyId}
    >
      <SalaryHeadTable
        data={data}
        pagination={pagination}
        currencyCode={currencyCode}
        isSuperAdmin={isSuperAdmin}
        companyOptions={companyOptions}
      />
    </SalaryHeadPageClient>
  );
}
