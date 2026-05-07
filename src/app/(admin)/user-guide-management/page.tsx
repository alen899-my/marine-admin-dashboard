import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { getUserGuides, getUserGuideGroups } from "@/lib/services/userGuideService";
import UserGuideManagementClient from "./UserGuideManagementClient";
import UserGuideTable from "./UserGuideTable";

export const metadata: Metadata = {
  title: "User Guide Management | Parkora Falcon",
  description: "Create and manage dynamic user guide content.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function UserGuideManagementPage({
  searchParams,
}: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const authz = await authorizeRequest("userguide.view");
  if (!authz.ok) return <div>Access Denied</div>;

  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;
  const limit = Number(resolvedParams.limit) || 20;
  const search = resolvedParams.search || "";
  const status = resolvedParams.status || "all";
  const group = resolvedParams.group || "all";

  const [guidesResult, groupsResult] = await Promise.all([
    getUserGuides({
      page,
      limit,
      search,
      status,
      group,
    }),
    getUserGuideGroups({
      page: 1,
      limit: 100,
      status: "active",
    }),
  ]);

  const groups = (groupsResult.data || []).map((g: any) => ({
    value: g._id,
    label: g.name,
  }));

  return (
    <UserGuideManagementClient totalCount={guidesResult.pagination.total} groups={groups}>
      <UserGuideTable data={guidesResult.data} pagination={guidesResult.pagination} />
    </UserGuideManagementClient>
  );
}
