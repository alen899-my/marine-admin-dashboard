import { auth } from "@/auth";
import { getNorReports, getFilterOptions } from "@/lib/services/nor-report";
import NorReportTable from "./NorReportTable";
import NorPageClient from "./NorPageClient";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function NoticeOfReadiness({ searchParams }: PageProps) {
  // 1. Auth
  const session = await auth();
  if (!session?.user) return <div>Unauthorized</div>;
  const user = session.user;
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";

  // 2. Data Fetching
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;

  const [reportData, filterOptions] = await Promise.all([
    getNorReports({
      ...resolvedParams,
      page,
      user,
    }),
    getFilterOptions(user),
  ]);

  const { data, pagination } = reportData;

  // 3. Render
  return (
    <NorPageClient
      data={data}
      totalCount={pagination.total}
      filterOptions={filterOptions}
      isSuperAdmin={isSuperAdmin}
    >
      <NorReportTable
        data={data}
        pagination={pagination}
        vesselList={filterOptions.vessels}
        allVoyages={filterOptions.voyages}
      />
    </NorPageClient>
  );
}