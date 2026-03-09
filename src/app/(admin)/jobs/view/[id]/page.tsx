import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Crew from "@/models/Application";
import Job from "@/models/Job";
import CrewApplicationForm from "@/components/Jobs/Application";
import { notFound, redirect } from "next/navigation";
import mongoose from "mongoose";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

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

  const raw = await Crew.findOne({ _id: id, deletedAt: null })
    .select("-adminNotes -__v")
    .lean();

  if (!raw) notFound();

  // Serialize all ObjectIds / Dates / Buffers to plain values
  const application = JSON.parse(JSON.stringify(raw));

  const companyId =
    typeof application.company === "string"
      ? application.company
      : application.company?.$oid ?? String(application.company);

  const activeJobsRes = await Job.find({ companyId, status: "active", isAccepting: true })
    .select("title")
    .sort({ createdAt: -1 })
    .lean();

  const availablePositions = activeJobsRes.map((j: any) => ({
    value: j.title,
    label: j.title,
  }));

  return (
    <div className="">
      <PageBreadcrumb
        pageTitle=""
        items={[{ label: "Crew Applications", href: "/jobs" }]}
      />
      <CrewApplicationForm
        mode="view"
        companyId={companyId}
        initialData={application}
        availablePositions={availablePositions}
      />
    </div>
  );
}
