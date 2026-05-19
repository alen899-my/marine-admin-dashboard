import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Metadata } from "next";
import PublicHeader from "@/layout/Publicheader";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ApplicationsTable from "@/components/Jobs/ApplicationsTablePublic";
import { getAllMyApplications } from "@/lib/services/applicationService";
import Link from "next/link";

export const metadata: Metadata = {
  title: "My Applications | Parkora Careers",
  description: "Track and manage all your candidate applications in one place.",
};

export default async function MyApplicationsPage() {
  const [, session] = await Promise.all([dbConnect(), auth()]);

  if (!session?.user) {
    redirect(`/careers/login?redirect=${encodeURIComponent("/careers/applications")}`);
  }

  const applications = await getAllMyApplications(session.user.id);

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Breadcrumb */}
          <div className="mb-5">
            <PageBreadcrumb
              pageTitle="My Applications"
              items={[{ label: "Careers", href: "/careers" }]}
            />
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] overflow-hidden">
            {/* Card body */}
            <div className="p-4 sm:p-5">
              <ApplicationsTable applications={applications} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
