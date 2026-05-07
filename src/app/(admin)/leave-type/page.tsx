import { auth } from "@/auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { authorizeRequest } from "@/lib/authorizeRequest";
import {
  getLeaveTypes,
  getCompaniesForLeaveType,
} from "@/lib/services/leaveTypeService";
import LeaveTypeTable from "./LeaveTypeTable";
import LeaveTypePageClient from "./LeaveTypePageClient";

export const metadata: Metadata = {
  title: "Leave Type Management | Parkora",
  description: "Manage different types of leaves in the system.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function LeaveTypeManagementPage({
  searchParams,
}: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const authz = await authorizeRequest("leavetype.view");
  if (!authz.ok) return <div>Access Denied</div>;

  const userRole = session.user.role?.toLowerCase() || "";
  const isSuperAdmin = userRole === "super-admin" || userRole === "super_admin";
  const userCompanyId = session.user.company?.id;

  if (!isSuperAdmin && !userCompanyId) {
    return (
      <div className="p-8 text-center text-red-500 font-semibold bg-red-50 rounded-lg border border-red-200 mt-6 mx-4">
        You do not have a company assigned. Access denied to Leave Type module.
      </div>
    );
  }

  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;
  const limit = Number(resolvedParams.limit) || 20;
  const search = resolvedParams.search || "";
  const status = resolvedParams.status || "all";
  const companyId = resolvedParams.companyId || "";

  const [{ data, pagination }, companies] = await Promise.all([
    getLeaveTypes({
      page,
      limit,
      search,
      status,
      companyId,
      user: session.user,
    }),
    isSuperAdmin ? getCompaniesForLeaveType() : Promise.resolve([]),
  ]);

  return (
    <LeaveTypePageClient
      totalCount={pagination.total}
      isSuperAdmin={isSuperAdmin}
      userCompanyId={userCompanyId}
      companies={companies}
    >
      <LeaveTypeTable
        data={data}
        pagination={pagination}
        isSuperAdmin={isSuperAdmin}
        companies={companies}
      />
    </LeaveTypePageClient>
  );
}
