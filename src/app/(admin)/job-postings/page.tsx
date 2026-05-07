import { Metadata } from "next";
import { auth } from "@/auth";
import { getJobPostings, getCompaniesForJobPostings } from "@/lib/services/jobPostingService";
import JobsTable from "./JobsTable";
import JobPostingsPageClient from "./Jobpostingspageclient";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Job Postings |  Parkora Falcon",
  description: "View and manage job postings.",
};

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}

export default async function JobPostingsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const userRole = session.user.role?.toLowerCase() || "";
  const isSuperAdmin = userRole === "super-admin" || userRole === "super_admin";
  const userCompanyId = session.user.company?.id;

  if (!isSuperAdmin && !userCompanyId) {
    return (
      <div className="p-8 text-center text-red-500 font-semibold bg-red-50 rounded-lg border border-red-200 mt-6 mx-4">
        You do not have a company assigned. Access denied to Jobs module.
      </div>
    );
  }

  const resolvedParams = (await searchParams) ?? {};
  const page = Number(resolvedParams.page) || 1;
  const limit = 20;
  const search = resolvedParams.search || "";
  const isAccepting = resolvedParams.isAccepting;
  const companyId = resolvedParams.companyId || "";

 const [{ data, pagination }, companies] = await Promise.all([
    getJobPostings({ page, limit, search, isAccepting, companyId, user: session.user }),
    getCompaniesForJobPostings(), 
]);

  return (
    <JobPostingsPageClient
      totalCount={pagination.total}
      isSuperAdmin={isSuperAdmin}
      userCompanyId={userCompanyId}
      companies={companies}
      selectedCompanyId={companyId}
    >
      <JobsTable
        data={data}
        pagination={{ page, limit, totalPages: pagination.totalPages }}
        isSuperAdmin={isSuperAdmin}
        companyOptions={companies}
      />
    </JobPostingsPageClient>
  );
}
