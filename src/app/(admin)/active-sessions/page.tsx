import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ActiveSessionsClient from "./ActiveSessionsClient";
import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";

export default async function ActiveSessionsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  const role = session.user.role?.toLowerCase();
  const isSuperAdmin = role === "super-admin" || role === "super_admin";
  const hasPermission = session.user.permissions?.includes("sessions.view");

  if (!isSuperAdmin && !hasPermission) {
    redirect("/");
  }

  let companies: { value: string; label: string }[] = [];
  if (isSuperAdmin) {
    await dbConnect();
    const companiesData = await Company.find({ status: "active" })
      .select("name _id")
      .lean();
    companies = companiesData.map((c) => ({
      value: c._id.toString(),
      label: c.name,
    }));
  }

  return (
    <ActiveSessionsClient
      currentUserId={session.user.id}
      currentSessionId={session.sessionId as string}
      isSuperAdmin={isSuperAdmin}
      companies={companies}
    />
  );
}
