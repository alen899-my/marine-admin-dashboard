import { auth } from "@/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { authorizeRequest } from "@/lib/authorizeRequest";
import {
  getAllowanceDeductions,
  getCompaniesForAllowanceDeductions,
} from "@/lib/services/allowanceDeductionService";
import AllowanceDeductionPageClient from "./AllowanceDeductionPageClient";
import AllowanceDeductionTable from "./AllowanceDeductionTable";

export const metadata: Metadata = {
  title: "Allowance & Deduction Master | Parkora",
  description: "Manage allowance and deduction master records.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function AllowanceDeductionManagementPage({
  searchParams,
}: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const authz = await authorizeRequest("allowance.deduction.view");
  if (!authz.ok) return <div>Access Denied</div>;

  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;
  const limit = Number(resolvedParams.limit) || 20;
  const search = resolvedParams.search || "";
  const type = resolvedParams.type || "all";
  const status = resolvedParams.status || "all";
  const companyId = resolvedParams.companyId || "";
  const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";

  const [{ data, pagination }, companies] = await Promise.all([
    getAllowanceDeductions({
      page,
      limit,
      search,
      type,
      status,
      companyId,
      user: session.user,
    }),
    isSuperAdmin
      ? getCompaniesForAllowanceDeductions()
      : Promise.resolve([]),
  ]);

  return (
    <AllowanceDeductionPageClient
      totalCount={pagination.total}
      companies={companies}
      isSuperAdmin={isSuperAdmin}
    >
      <AllowanceDeductionTable data={data} pagination={pagination} />
    </AllowanceDeductionPageClient>
  );
}
