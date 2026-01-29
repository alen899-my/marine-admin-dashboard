import { auth } from "@/auth";
import { getCargoReports, getFilterOptions } from "@/lib/services/cargo-report";
import CargoReportTable from "./CargoReportTable";
import CargoPageClient from "./CargoPageClient";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function CargoReportPage({ searchParams }: PageProps) {
  // 1. Auth
  const session = await auth();
  if (!session?.user) return <div>Unauthorized</div>;
  const user = session.user;
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";

  // 2. Data Fetching
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;

  const [reportData, filterOptions] = await Promise.all([
    getCargoReports({
      ...resolvedParams,
      page,
      user,
    }),
    getFilterOptions(user),
  ]);

  const { data, pagination } = reportData;

  // 3. Render
  return (
    <CargoPageClient
      data={data}
      totalCount={pagination.total}
      filterOptions={filterOptions}
      isSuperAdmin={isSuperAdmin}
    >
      <CargoReportTable
        data={data}
        pagination={pagination}
        vesselList={filterOptions.vessels}
        allVoyages={filterOptions.voyages}
      />
    </CargoPageClient>
  );
}