// /app/(admin)/pre-arrival/page.tsx
import { authorizeRequest } from "@/lib/authorizeRequest";
import { getPreArrivalData } from "@/lib/services/preArrivalService";
import PreArrivalClient from "./PreArrivalClient";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pre-Arrival Management | Parkora Falcon",
  description: "Manage pre-arrival operations for maritime vessels.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function PreArrivalManagement({ searchParams }: PageProps) {
  // 1. Authorize on Server
  const authz = await authorizeRequest("prearrival.view");
  if (!authz.ok || !authz.session) {
    redirect("/login");
  }

  // 2. Parse URL search params (same pattern as Companies page)
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;
  const limit = 10;
  const search = resolvedParams.search || "";
  const status = resolvedParams.status || "all";
  const vesselId = resolvedParams.vesselId || "";
  const companyId = resolvedParams.companyId || "";

  // 3. Direct DB Call with all filter params
  const initialData = await getPreArrivalData({
    user: authz.session.user,
    init: true,
    page,
    limit,
    search,
    status,
    vesselId: vesselId || undefined,
    companyId: companyId || undefined,
  });

  const isSuperAdmin =
    authz.session.user?.role?.toLowerCase() === "super-admin";

  // 4. Render Client Component with fully hydrated SSR data
  return (
    <PreArrivalClient
      initialRequests={JSON.parse(JSON.stringify(initialData.data))}
      initialVessels={JSON.parse(JSON.stringify(initialData.vessels))}
      initialVoyages={JSON.parse(JSON.stringify(initialData.voyages))}
      initialCompanies={JSON.parse(JSON.stringify(initialData.companies))}
      pagination={initialData.pagination}
      user={authz.session.user}
      isSuperAdmin={isSuperAdmin}
    />
  );
}