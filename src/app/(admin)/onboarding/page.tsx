import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import OnboardingPageClient from "./OnboardingPageClient";
import OnboardingTable from "./OnboardingTable";
import { Metadata } from "next";
import mongoose from "mongoose";
import {
  getCandidateApplications,
  getAllCompaniesForDropdown,
  getJobsForDropdown,
} from "@/lib/services/applicationService";

export const metadata: Metadata = {
  title: "Onboarding Management | Parkora Falcon",
  description: "Manage crew onboarding, checklists, and confirm boarding.",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function OnboardingManagement({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    return (
      <div className="p-8 text-center font-medium">Unauthorized Access</div>
    );
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
        Account Error: Your user profile is not linked to a company. Please
        contact system administration.
      </div>
    );
  }

  if (targetCompanyId && !mongoose.isValidObjectId(targetCompanyId)) {
    return (
      <div className="p-8 text-center text-red-500 font-medium">
        Invalid company ID.
      </div>
    );
  }

  const currentPage = Math.max(1, Number(resolvedParams.page) || 1);
  const limit = 50;

  try {
    await dbConnect();

    const [{ data: applications, pagination }, companies, jobs] =
      await Promise.all([
        getCandidateApplications({
          page: currentPage,
          limit,
          search: resolvedParams.search,
          status: ["accepted", "onboarding_ready"],
          startDate: resolvedParams.startDate,
          endDate: resolvedParams.endDate,
          jobTitle: resolvedParams.jobTitle,
          companyId: isSuperAdminNoCompany
            ? undefined
            : (targetCompanyId ?? undefined),
          user,
        }),
        isSuperAdmin
          ? getAllCompaniesForDropdown()
          : Promise.resolve([] as { id: string; name: string }[]),
        getJobsForDropdown(
          isSuperAdminNoCompany ? undefined : (targetCompanyId ?? undefined),
        ),
      ]);

    const total = pagination.total;

    return (
      <OnboardingPageClient
        data={applications}
        totalCount={total}
        companies={companies}
        jobs={jobs}
        isSuperAdmin={isSuperAdmin}
        currentCompanyId={
          isSuperAdminNoCompany ? "all" : (targetCompanyId ?? "")
        }
        portalCompanyId={targetCompanyId ?? ""}
      >
        <OnboardingTable
          data={applications}
          pagination={{
            page: currentPage,
            limit,
            total,
            totalPages: pagination.totalPages,
          }}
          isSuperAdmin={isSuperAdmin}
        />
      </OnboardingPageClient>
    );
  } catch (error) {
    console.error("ONBOARDING MANAGEMENT PAGE ERROR →", error);
    return (
      <div className="p-8 text-center text-red-500 font-medium">
        Error loading onboarding data. Please try again later.
      </div>
    );
  }
}
