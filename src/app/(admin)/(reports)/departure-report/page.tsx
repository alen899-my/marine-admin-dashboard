import { auth } from "@/auth";
import { getDepartureReports, getFilterOptions } from "@/lib/services/departure-report";
import DepartureReportTable from "./DepartureReportTable";
import DeparturePageClient from "./DeparturePageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Departure Report | Parkora Falcon",
  description: "Comprehensive departure report management for maritime operations.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function DepartureReportPage({ searchParams }: PageProps) {
  // 1. Auth
  const session = await auth();
  if (!session?.user) return <div>Unauthorized</div>;
  const user = session.user;
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";

  // 2. Data Fetching
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;

  const [reportData, filterOptions] = await Promise.all([
    getDepartureReports({
      ...resolvedParams,
      page,
      user,
    }),
    getFilterOptions(user),
  ]);

  const { data, pagination } = reportData;

  // 3. Render
  return (
    <DeparturePageClient
      data={data}
      totalCount={pagination.total}
      filterOptions={filterOptions}
      isSuperAdmin={isSuperAdmin}
    >
      <DepartureReportTable
        data={data}
        pagination={pagination}
        vesselList={filterOptions.vessels}
        allVoyages={filterOptions.voyages} // ✅ Pass voyages
      />
    </DeparturePageClient>
  );
}