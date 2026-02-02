import { auth } from "@/auth";
import { getVoyageOptions, getVoyages } from "@/lib/services/voyages";
import VoyagePageClient from "./VoyagePageClient";
import VoyageTable from "./VoyageTable";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function VoyageManagement({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) return <div>Unauthorized</div>;
  const user = session.user;
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const canAdd = true;

  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;

  const [voyageData, options] = await Promise.all([
    getVoyages({ ...resolvedParams, page, user }),
    getVoyageOptions(user),
  ]);

  const { data, pagination } = voyageData;

  return (
    <VoyagePageClient
      totalCount={pagination.total}
      companies={options.companies}
      vessels={options.vessels}
      isSuperAdmin={isSuperAdmin}
      canAdd={canAdd}
    >
      <VoyageTable
        data={data}
        pagination={pagination}
        vesselList={options.vessels}
      />
    </VoyagePageClient>
  );
}
