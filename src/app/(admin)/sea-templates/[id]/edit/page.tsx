// src/app/(admin)/sea-templates/[id]/edit/page.tsx
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";
import { getSeaTemplateById } from "@/lib/services/Seatemplateservice";
import { getSchemaCards } from "@/lib/Getschemacards";
import SeaTemplateForm from "@/components/templates/Seatemplateform";
import type { PlaceholderCard } from "@/lib/seaPlaceholders";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Edit SEA Template | Parkora Falcon" };

interface Props { params: Promise<{ id: string }>; }
interface TemplateCompanyRef {
  _id?: string;
}
interface TemplateShape {
  company?: string | TemplateCompanyRef | null;
}
interface CompanyOptionSource {
  _id: { toString(): string };
  name: string;
  logo?: string;
}

export default async function EditSeaTemplatePage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const { id } = await params;
  await dbConnect();

  const template = (await getSeaTemplateById(id)) as TemplateShape | null;

  if (!template) notFound();

  const user = session.user;
  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const templateCompanyId =
    typeof template.company === "object" && template.company?._id
      ? String(template.company._id)
      : typeof template.company === "string"
        ? template.company
        : "";
  const userCompanyId = user.company?.id || "";
  const placeholderCards: PlaceholderCard[] = await getSchemaCards(
    isSuperAdmin ? templateCompanyId : userCompanyId,
  );

  if (isSuperAdmin) {
    const allCompanies = await Company.find({ deletedAt: null, status: "active" })
      .select("name logo")
      .sort({ name: 1 })
      .lean<CompanyOptionSource[]>();

    return (
      <SeaTemplateForm
        mode="edit"
        templateId={id}
        initialData={template}
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

  const companyId = userCompanyId;
  const company = companyId
    ? await Company.findById(companyId)
        .select("name logo")
        .lean<CompanyOptionSource | null>()
    : null;

  return (
    <SeaTemplateForm
      mode="edit"
      templateId={id}
      initialData={template}
      placeholderCards={placeholderCards}
      companyId={companyId}
      companyName={company?.name || ""}
      companyLogo={company?.logo || ""}
    />
  );
}
