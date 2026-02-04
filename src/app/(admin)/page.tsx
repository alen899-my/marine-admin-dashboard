import { Suspense } from "react";
import { auth } from "@/auth";
import CompanyFilter from "@/components/dashboard/CompanyFilter";
import { Metrics } from "@/components/dashboard/Metrics";
import { MetricsSkeleton } from "@/components/dashboard/MetricsSkeleton"; // Import the new skeleton
import { dbConnect } from "@/lib/db";
import { getDashboardMetrics } from "@/lib/services/dashboard";
import Company from "@/models/Company";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Parkora Falcon",
  description: "Professional Dashboard for Parkora Falcon Maritime Operations.",
};

// Helper: Fetch Companies (Kept here as it's likely fast or needed for the filter UI immediately)
async function getCompanyOptions() {
  await dbConnect();
  const companies = await Company.find({ status: "active", deletedAt: null })
    .select("_id name")
    .lean();

  const formatted = companies.map((c: any) => ({
    value: c._id.toString(),
    label: c.name,
  }));

  return [{ value: "", label: "All Companies" }, ...formatted];
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  // 1. Get Session FAST (Do not block long for this)
  const session = await auth();
  if (!session?.user) return <div>Unauthorized</div>;

  const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
  
  // Resolve params
  const resolvedSearchParams = await searchParams;
  const selectedCompanyId = (resolvedSearchParams?.companyId as string) || "";

  // 2. Fetch Filter Options (usually fast)
  // We keep this awaited here so the filter appears immediately with the skeleton
  const companyOptions = isSuperAdmin ? await getCompanyOptions() : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
        {isSuperAdmin && <CompanyFilter options={companyOptions} />}
      </div>

      {/* 3. Wrap the SLOW metrics fetching in Suspense.
           We pass the 'user' to the Skeleton so it knows which boxes to show.
      */}
      <Suspense fallback={<MetricsSkeleton user={session.user} />}>
        <MetricsLoader user={session.user} companyId={selectedCompanyId} />
      </Suspense>
    </div>
  );
}

// --- Internal Component to handle Data Fetching ---
async function MetricsLoader({ user, companyId }: { user: any; companyId: string }) {
  // This performs the slow DB call
  const metricsData = await getDashboardMetrics(user, companyId);
  
  return <Metrics data={metricsData} />;
}