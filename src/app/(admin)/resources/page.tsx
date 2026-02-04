import { auth } from "@/auth";
import { getResources } from "@/lib/services/resourceService";
import { authorizeRequest } from "@/lib/authorizeRequest"; // Assuming you might use this for quick auth check or stick to session
import ResourcePageClient from "./ResourcePageClient";
import ResourceTable from "./ResourceTable";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resource Management | Parkora Falcon",
  description: "Manage resource information and operations for maritime vessels.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function ResourceManagementPage({ searchParams }: PageProps) {
  // 1. Auth Check
  const session = await auth();
  if (!session?.user) {
     redirect("/login");
  }

  // Optional: Strict Server-Side Permission Check
const authz = await authorizeRequest("resource.view");
  if (!authz.ok) return <div>Access Denied</div>;

  const user = session.user;

  // 2. Parse Params
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;
  const limit = Number(resolvedParams.limit) || 20;
  const search = resolvedParams.search || "";
  const status = resolvedParams.status || "all";

  // 3. Fetch Data Direct from DB
  const { data, pagination } = await getResources({
    page,
    limit,
    search,
    status,
    user,
  });

  // 4. Render
  return (
    <ResourcePageClient totalCount={pagination.total}>
      <ResourceTable data={data} pagination={pagination} />
    </ResourcePageClient>
  );
}