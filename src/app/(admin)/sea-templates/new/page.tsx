// src/app/(admin)/sea-templates/new/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";
import { getSchemaCards } from "@/lib/Getschemacards";
import SeaTemplateForm from "@/components/templates/Seatemplateform";
import type { PlaceholderCard } from "@/lib/seaPlaceholders";
import { Metadata } from "next";

interface CompanyOptionSource {
  _id: { toString(): string };
  name: string;
  logo?: string;
  address?: string;
}

export const metadata: Metadata = { title: "New SEA Template | Parkora Falcon" };

export default async function NewSeaTemplatePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const user = session.user;
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const companyId = user.company?.id || "";

  await dbConnect();

  const placeholderCards: PlaceholderCard[] = await getSchemaCards(
    isSuperAdmin ? undefined : companyId,
  );

  if (isSuperAdmin) {
    const allCompanies = await Company.find({ deletedAt: null, status: "active" })
      .select("name logo")
      .sort({ name: 1 })
      .lean<CompanyOptionSource[]>();

    return (
      <SeaTemplateForm
        mode="create"
        isSuperAdmin
        placeholderCards={placeholderCards}
        companies={allCompanies.map((c) => ({
          value: c._id.toString(),
          label: c.name,
          logo: c.logo,
        }))}
      />
    );
  }

  const company = companyId
    ? await Company.findById(companyId)
        .select("name logo address")
        .lean<CompanyOptionSource | null>()
    : null;

  return (
    <SeaTemplateForm
      mode="create"
      placeholderCards={placeholderCards}
      companyId={companyId}
      companyName={company?.name || user.company?.name || ""}
      companyLogo={company?.logo || ""}
    />
  );
}
