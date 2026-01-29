import { auth } from "@/auth";
import { getArrivalReports, getFilterOptions } from "@/lib/services/arrival-report";
import ArrivalReportTable from "./ArrivalReportTable";
import ArrivalPageClient from "./ArrivalPageClient";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function ArrivalReportPage({ searchParams }: PageProps) {
  // 1. Auth
  const session = await auth();
  if (!session?.user) return <div>Unauthorized</div>;
  const user = session.user;
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";

  // 2. Data Fetching
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;

  const [reportData, filterOptions] = await Promise.all([
    getArrivalReports({
      ...resolvedParams,
      page,
      user,
    }),
    getFilterOptions(user),
  ]);

  const { data, pagination } = reportData;

  // 3. Render
  return (
    <ArrivalPageClient
      data={data}
      totalCount={pagination.total}
      filterOptions={filterOptions}
      isSuperAdmin={isSuperAdmin}
    >
      <ArrivalReportTable
        data={data}
        pagination={pagination}
        vesselList={filterOptions.vessels}
        allVoyages={filterOptions.voyages}
      />
    </ArrivalPageClient>
  );
}