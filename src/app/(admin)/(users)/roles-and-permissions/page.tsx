import { auth } from "@/auth";
import { getRoles } from "@/lib/services/roleService";
import { redirect } from "next/navigation";
import RolePageClient from "./RolePageClient";
import RolesTable from "./RolesTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Role Management | Parkora Falcon",
  description: "Manage roles and permissions for maritime vessels.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function RoleManagementPage({ searchParams }: PageProps) {
  // 1. Auth Check
  const session = await auth();
  if (!session?.user) redirect("/login");

  // 2. Parse Params
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;
  const limit = 20;
  const search = resolvedParams.search || "";
  const status = resolvedParams.status || "all";

  // 3. Fetch Data Directly (No API Call)
  const { data, pagination } = await getRoles({
    page,
    limit,
    search,
    status,
    user: session.user,
  });

  // 4. Render
  return (
    <RolePageClient totalCount={pagination.total}>
      <RolesTable data={data} pagination={pagination} />
    </RolePageClient>
  );
}