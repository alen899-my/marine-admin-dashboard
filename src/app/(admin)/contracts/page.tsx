import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import ContractPageClient from "./ContractPageClient";
import ContractTable from "./ContractTable";
import { getCompanyCurrency } from "@/lib/services/companyService";
import { Metadata } from "next";
import mongoose from "mongoose";
import {
  getCandidateApplications,
  getAllCompaniesForDropdown,
  getJobsForDropdown,
} from "@/lib/services/applicationService";
import { getVesselOptionsForDropdown } from "@/lib/services/vessels";
import { getSettings } from "@/lib/systemSettings.server";

export const metadata: Metadata = {
  title: "Contracts Management | Parkora Falcon",
  description: "Manage Selected Candidates and Contracts.",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function ContractsManagement({ searchParams }: PageProps) {
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

  // Get company currency
  let currencyCode = "USD";
  let currencySettings = await getSettings(targetCompanyId ? { companyId: targetCompanyId } : undefined);
  if (targetCompanyId) {
    try {
      currencyCode = await getCompanyCurrency(targetCompanyId);
    } catch (e) {
      // Default to USD on error
    }
  }

  const currentPage = Math.max(1, Number(resolvedParams.page) || 1);
  const limit = 50;

  try {
    await dbConnect();

    const [{ data: applications, pagination }, companies, jobs, vessels] =
      await Promise.all([
        getCandidateApplications({
          page: currentPage,
          limit,
          search: resolvedParams.search,
          status: ["selected", "offer_sea_issued"], // Fetch both selected and offer_sea_issued candidates
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
        getVesselOptionsForDropdown(
          isSuperAdminNoCompany ? undefined : (targetCompanyId ?? undefined),
        ),
      ]);

    const total = pagination.total;

    return (
      <ContractPageClient
        data={applications}
        totalCount={total}
        companies={companies}
        jobs={jobs}
        vessels={vessels}
        isSuperAdmin={isSuperAdmin}
        currentCompanyId={
          isSuperAdminNoCompany ? "all" : (targetCompanyId ?? "")
        }
        portalCompanyId={targetCompanyId ?? ""}
        currencySettings={currencySettings}
      >
        <ContractTable
          data={applications}
          pagination={{
            page: currentPage,
            limit,
            total,
            totalPages: pagination.totalPages,
          }}
          isSuperAdmin={isSuperAdmin}
          vessels={vessels}
          currencyCode={currencyCode}
          currencySettings={currencySettings}
        />
      </ContractPageClient>
    );
  } catch (error) {
    console.error("CONTRACTS MANAGEMENT PAGE ERROR →", error);
    return (
      <div className="p-8 text-center text-red-500 font-medium">
        Error loading contracts. Please try again later.
      </div>
    );
  }
}
