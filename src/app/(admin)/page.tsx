import { auth } from "@/auth"; // Your NextAuth configuration
import CompanyFilter from "@/components/dashboard/CompanyFilter";
import { Metrics } from "@/components/dashboard/Metrics";
import { dbConnect } from "@/lib/db";
import { getDashboardMetrics } from "@/lib/services/dashboard";
import Company from "@/models/Company";

// 1. Helper to fetch company list for dropdown (Server Side)
async function getCompanyOptions() {
  await dbConnect();
  // Fetch only necessary fields
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
  // 2. Get Session
  const session = await auth();
  if (!session?.user) return <div>Unauthorized</div>;

  const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";

  const resolvedSearchParams = await searchParams;
  const selectedCompanyId = (resolvedSearchParams?.companyId as string) || "";

  // 4. Parallel Data Fetching
  // We fetch metrics AND company list (if admin) at the same time
  const [metricsData, companyOptions] = await Promise.all([
    getDashboardMetrics(session.user, selectedCompanyId),
    isSuperAdmin ? getCompanyOptions() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
        {isSuperAdmin && <CompanyFilter options={companyOptions} />}
      </div>

      {/* 5. Pass pre-fetched data to the client component */}
      <Metrics data={metricsData} />
    </div>
  );
}
