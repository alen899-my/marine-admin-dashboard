import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CrewApplicationForm from "@/components/Jobs/Application";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default async function NewApplicationPage() {
  const session = await auth();

  // Guard: Ensure user is logged in
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const user = session.user;
  const companyId = user.company?.id;

  if (!companyId) {
    return (
      <div className="p-6 text-red-500 bg-red-50 rounded-lg">
        <p>
          Error: Your account is not linked to a company. You cannot create applications.
        </p>
      </div>
    );
  }

  return (
    <div className=" mx-auto">
      <PageBreadcrumb
        pageTitle="New Application"
        items={[{ label: "Crew Applications", href: "/jobs" }]}
      />

      <CrewApplicationForm
        companyId={companyId}
        companyName={user.company?.name}
      />
    </div>
  );
}