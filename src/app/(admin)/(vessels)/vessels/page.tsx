import { auth } from "@/auth";
import { getCompanyOptions, getVessels } from "@/lib/services/vessels";
import VesselPageClient from "./VesselPageClient";
import VesselTable from "./VesselTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vessel Management | Parkora Falcon",
  description: "Manage vessel information and operations for maritime vessels.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function VesselManagement({ searchParams }: PageProps) {
  // 1. Auth
  const session = await auth();
  if (!session?.user) return <div>Unauthorized</div>;
  const user = session.user;
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const canAdd = true; // Logic simplified, usually handled by checking permissions array in user object

  // 2. Data Fetching
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;

  const [vesselData, companies] = await Promise.all([
    getVessels({
      ...resolvedParams,
      page,
      user,
    }),
    isSuperAdmin ? getCompanyOptions() : Promise.resolve([]),
  ]);

  const { data, pagination } = vesselData;

  // 3. Render
  return (
    <VesselPageClient
      totalCount={pagination.total}
      companies={companies}
      isSuperAdmin={isSuperAdmin}
      canAdd={canAdd}
    >
      <VesselTable data={data} pagination={pagination} />
    </VesselPageClient>
  );
}
