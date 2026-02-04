import { auth } from "@/auth";
import { getAnalysisOptions, getVoyagePerformanceData } from "@/lib/services/voyage-performance";
import VoyageAnalysisClient from "./VoyageAnalysisClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Voyage Analysis & Performance Report | Parkora Falcon",
  description: "Comprehensive voyage analysis and performance report management for maritime operations.",
};

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
    getAnalysisOptions(vesselId, session.user),
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