// src/app/(admin)/sea-templates/page.tsx
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { getSeaTemplates, getAllCompaniesForTemplatePage } from "@/lib/services/Seatemplateservice";
import SeaTemplatesPageClient from "./Seatemplatespageclient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SEA Templates | Parkora Falcon",
  description: "Manage Seafarer Employment Agreement templates.",
};

export const dynamic = "force-dynamic";

export default async function SeaTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; search?: string; status?: string; companyId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    return (
      <div className="p-8 text-center font-medium">Unauthorized Access</div>
    );
  }

  const user = session.user;
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const companyId = user.company?.id || "";

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page || "1", 10));
  const limit = Math.max(1, parseInt(sp?.limit || "10", 10));
  const search = sp?.search || "";
  const status = sp?.status || "all";
  const companyIdFilter = sp?.companyId || "";

  const filters = { search, status, companyId: companyIdFilter };

  await dbConnect();
  const [result, companies] = await Promise.all([
    getSeaTemplates(
      companyId,
      (user as any).id,
      user.role || "",
      page,
      limit,
      filters
    ),
    isSuperAdmin ? getAllCompaniesForTemplatePage() : Promise.resolve([]),
  ]);

  const companyOptions = companies.map((c: any) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <SeaTemplatesPageClient
      data={result.data}
      pagination={result.pagination}
      isSuperAdmin={isSuperAdmin}
      companies={companyOptions}
    />
  );
}
