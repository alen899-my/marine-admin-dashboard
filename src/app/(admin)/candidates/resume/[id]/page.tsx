// app/(admin)/candidates/resume/[id]/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import Candidate from "@/models/Candidate";

export default async function ResumeRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ← await params

  const session = await auth();

  if (!session?.user) {
    redirect(`/signin?redirect=/candidates/resume/${id}`);
  }

  await dbConnect();
  const app = (await Candidate.findById(id)
    .select("resume company")
    .lean()) as any;

  console.log("DEBUG resume →", JSON.stringify(app?.resume));

  if (!app?.resume?.fileUrl?.trim()) {
    return (
      <div className="p-8 text-center text-red-500">
        Resume not found. (uploadStatus:{" "}
        {app?.resume?.uploadStatus ?? "no record"})
      </div>
    );
  }

  const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
  const userCompanyId = session.user.company?.id;
  if (!isSuperAdmin && app.company?.toString() !== userCompanyId) {
    return <div className="p-8 text-center text-red-500">Access denied.</div>;
  }

  redirect(app.resume.fileUrl);
}
