import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Candidate from "@/models/Candidate";
import CandidateApplicationForm from "@/components/Jobs/Application";
import { notFound, redirect } from "next/navigation";
import mongoose from "mongoose";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { resolveApplicationPosition } from "@/lib/services/applicationService";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ViewApplicationPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return (
      <div className="p-8 text-center text-red-500 font-medium">
        Invalid application ID.
      </div>
    );
  }

  await dbConnect();

  const raw = await Candidate.findOne({ _id: id, deletedAt: null })
    .select("-adminNotes -__v")
    .lean();
  if (!raw) notFound();

  const application = JSON.parse(JSON.stringify(raw));
  const companyId =
    typeof application.company === "string"
      ? application.company
      : (application.company?.$oid ?? String(application.company));

  return (
    <div className="">
      <PageBreadcrumb
        pageTitle=""
        items={[{ label: "Candidate Applications", href: "/candidates" }]}
      />
      <CandidateApplicationForm
        mode="view"
        companyId={companyId}
        initialData={await resolveApplicationPosition(application)}
      />
    </div>
  );
}
