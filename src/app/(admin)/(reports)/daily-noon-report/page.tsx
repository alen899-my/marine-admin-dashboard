import { auth } from "@/auth";
import { getFilterOptions, getNoonReports } from "@/lib/services/noon-report";
import DailyNoonReportClient from "./DailyNoonPageClient"; //  Import the new wrapper
import DailyNoonReportTable from "./DailyNoonReportTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Noon Report | Parkora Falcon",
  description: "Comprehensive daily noon report management for maritime operations.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function DailyNoonReportPage({ searchParams }: PageProps) {
  // 1. Auth
  const session = await auth();
  if (!session?.user) return <div>Unauthorized</div>;
  const user = session.user;
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";

  // 2. Data Fetching
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;

  const [reportData, filterOptions] = await Promise.all([
    getNoonReports({
      ...resolvedParams,
      page,
      user,
    }),
    getFilterOptions(user),
  ]);

  const { data, pagination } = reportData;

  // 3. Render
  // We wrap the Table (Server Component) inside the Client Layout (Interactivity)
  //

  return (
    <DailyNoonReportClient
      data={data}
      totalCount={pagination.total}
      filterOptions={filterOptions}
      isSuperAdmin={isSuperAdmin}
    >
      <DailyNoonReportTable
        data={data}
        pagination={pagination}
        vesselList={filterOptions.vessels}
        allVoyages={filterOptions.voyages}
      />
    </DailyNoonReportClient>
  );
}
