import { auth } from "@/auth";
import { getUserMetadata, getUsers } from "@/lib/services/users";
import UserPageClient from "./UserPageClient";
import UserTable from "./UsersTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management | Parkora Falcon",
  description: "Manage user information and operations for maritime vessels.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function UserManagement({ searchParams }: PageProps) {
  // 1. Auth
  const session = await auth();
  if (!session?.user) return <div>Unauthorized</div>;
  const user = session.user;
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const canAdd = true; // Simplified check, usually based on user.permissions

  // 2. Data Fetching
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;

  const [userData, metadata] = await Promise.all([
    getUsers({ ...resolvedParams, page, user }),
    getUserMetadata(user),
  ]);

  const { data, pagination } = userData;

  // 3. Render
  return (
    <UserPageClient
      totalCount={pagination.total}
      companies={metadata.companies}
      isSuperAdmin={isSuperAdmin}
      canAdd={canAdd}
    >
      <UserTable
        data={data}
        pagination={pagination}
        roles={metadata.roles}
        permissions={metadata.permissions}
      />
    </UserPageClient>
  );
}
