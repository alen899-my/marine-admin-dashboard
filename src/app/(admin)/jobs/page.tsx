import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";
import JobPageClient from "./JobPageClient";
import JobTable from "./JobTable";
import { Metadata } from "next";
import mongoose from "mongoose";
import { getCrewApplications, getAllCompaniesForDropdown } from "@/lib/services/applicationService";

export const metadata: Metadata = {
  title: "Crew Management | Parkora Falcon",
  description: "Manage crew applications, CVs, and recruitment workflow.",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function JobManagement({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    return <div className="p-8 text-center font-medium">Unauthorized Access</div>;
  }

  const user = session.user;
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";

  const resolvedParams = await searchParams;
  const sessionCompanyId = user.company?.id;
  const isSuperAdminNoCompany = isSuperAdmin && !resolvedParams.companyId;

  const targetCompanyId =
    isSuperAdmin && resolvedParams.companyId
      ? resolvedParams.companyId
      : sessionCompanyId;

  if (!isSuperAdminNoCompany && !targetCompanyId) {
    return (
      <div className="p-8 text-center text-amber-600 bg-amber-50 rounded-lg border border-amber-200">
        Account Error: Your user profile is not linked to a company. Please contact system administration.
      </div>
    );
  }

  if (targetCompanyId && !mongoose.isValidObjectId(targetCompanyId)) {
    return <div className="p-8 text-center text-red-500 font-medium">Invalid company ID.</div>;
  }

  const currentPage = Math.max(1, Number(resolvedParams.page) || 1);
  const limit = 10;

  try {
    await dbConnect();

    const [{ data: applications, pagination }, companies] =
      await Promise.all([
        getCrewApplications({
          page: currentPage,
          limit,
          search: resolvedParams.search,
          status: resolvedParams.status,
          startDate: resolvedParams.startDate,
          endDate: resolvedParams.endDate,
          companyId: isSuperAdminNoCompany ? undefined : (targetCompanyId ?? undefined),
          user,
        }),

        isSuperAdmin
          ? getAllCompaniesForDropdown()
          : Promise.resolve([] as { id: string; name: string }[]),
      ]);

    const total = pagination.total;

    return (
      <JobPageClient
        totalCount={total}
        companies={companies}
        isSuperAdmin={isSuperAdmin}
        canAdd={true}
        currentCompanyId={isSuperAdminNoCompany ? "all" : (targetCompanyId ?? "")}
        portalCompanyId={targetCompanyId ?? ""}
      >
        <JobTable
          data={applications}
          pagination={{
            page: currentPage,
            limit,
            total,
            totalPages: pagination.totalPages,
          }}
        />
      </JobPageClient>
    );
  } catch (error) {
    console.error("JOB MANAGEMENT PAGE ERROR →", error);
    return (
      <div className="p-8 text-center text-red-500 font-medium">
        Error loading applications. Please try again later.
      </div>
    );
  }
}