import { auth } from "@/auth";
import { getAnalysisOptions, getVoyagePerformanceData } from "@/lib/services/voyage-performance";
import VoyageAnalysisClient from "./VoyageAnalysisClient";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function VoyageAnalysisPage({ searchParams }: PageProps) {
  // 1. Auth Check
  const session = await auth();
  if (!session?.user) return <div>Unauthorized</div>;

  // 2. Resolve Params
  const resolvedParams = await searchParams;
  const vesselId = resolvedParams.vesselId || "";
  const voyageId = resolvedParams.voyageId || "";

  // 3. Parallel Fetching (Options & Performance Data)
  const [options, performanceData] = await Promise.all([
    getAnalysisOptions(vesselId),
    voyageId ? getVoyagePerformanceData(voyageId) : Promise.resolve(null)
  ]);

  // 4. Render Client
  return (
    <VoyageAnalysisClient 
       vesselOptions={options.vessels}
       voyageOptions={options.voyages}
       performanceData={performanceData}
    />
  );
}