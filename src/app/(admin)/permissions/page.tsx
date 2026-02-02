import { auth } from "@/auth";
import { getPermissions } from "@/lib/services/permissionService";
import PermissionPageClient from "./PermissionPageClient";
import PermissionTable from "./PermissionTable";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function PermissionManagementPage({ searchParams }: PageProps) {
  // 1. Auth Check
  const session = await auth();
  if (!session?.user) redirect("/login");

  // 2. Parse URL Params
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;
  const limit = 20;
  const search = resolvedParams.search || "";
  const status = resolvedParams.status || "all";
  const module = resolvedParams.module || ""; // Resource ID

  // 3. Fetch Data Directly
  const { data, pagination, resources } = await getPermissions({
    page,
    limit,
    search,
    status,
    module,
    user: session.user,
  });

  // Format resources for the dropdown
  const resourceOptions = resources.map((r: any) => ({ id: r._id, name: r.name }));

  // 4. Render Client Wrapper with Server Data
  return (
    <PermissionPageClient
      totalCount={pagination.total}
      resourceOptions={resourceOptions}
    >
      <PermissionTable
        data={data}
        pagination={pagination}
        resourceOptions={resourceOptions}
      />
    </PermissionPageClient>
  );
}