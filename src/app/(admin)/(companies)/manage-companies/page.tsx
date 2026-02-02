import { auth } from "@/auth";
import { getCompanies } from "@/lib/services/companyService";
import { redirect } from "next/navigation";
import CompanyPageClient from "./CompanyPageClient";
import CompaniesTable from "./CompaniesTable";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function CompanyManagementPage({ searchParams }: PageProps) {
  // 1. Auth Check
  const session = await auth();
  if (!session?.user) redirect("/login");

  // 2. Parse Params
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;
  const limit = 20;
  const search = resolvedParams.search || "";
  const status = resolvedParams.status || "all";
  const startDate = resolvedParams.startDate || "";
  const endDate = resolvedParams.endDate || "";

  // 3. Fetch Data Directly (SSR)
  const { data, pagination } = await getCompanies({
    page,
    limit,
    search,
    status,
    startDate,
    endDate,
    user: session.user,
  });

  // 4. Render
  return (
    <CompanyPageClient totalCount={pagination.total}>
      <CompaniesTable data={data} pagination={pagination} />
    </CompanyPageClient>
  );
}