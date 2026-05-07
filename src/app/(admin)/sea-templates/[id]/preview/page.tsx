// src/app/(admin)/sea-templates/[id]/preview/page.tsx
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getSeaTemplateById } from "@/lib/services/Seatemplateservice";
import SeaTemplatePreviewPage from "./SeaTemplatePreviewPage";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TemplatPreviewRoute({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const { id } = await params;
  const template = await getSeaTemplateById(id);
  if (!template) notFound();

  return <SeaTemplatePreviewPage template={template} />;
}