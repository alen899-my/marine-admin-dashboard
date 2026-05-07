import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { getUserGuideGroups } from "@/lib/services/userGuideService";
import UserGuideGroupManagementClient from "./UserGuideGroupManagementClient";
import UserGuideGroupTable from "./UserGuideGroupTable";

export const metadata: Metadata = {
  title: "User Guide Groups | Parkora Falcon",
  description: "Manage groups used by user guides.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function UserGuideGroupsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const authz = await authorizeRequest("userguide.view");
  if (!authz.ok) return <div>Access Denied</div>;

  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;
  const limit = Number(resolvedParams.limit) || 20;
  const search = resolvedParams.search || "";
  const status = resolvedParams.status || "all";

  const { data, pagination } = await getUserGuideGroups({
    page,
    limit,
    search,
    status,
  });

  return (
    <UserGuideGroupManagementClient totalCount={pagination.total}>
      <UserGuideGroupTable data={data} pagination={pagination} />
    </UserGuideGroupManagementClient>
  );
}
